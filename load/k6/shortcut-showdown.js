import http from "k6/http";
import ws from "k6/ws";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const DEFAULT_API_BASE_URL = "https://shortcut-showdown-api.onrender.com";
const DEFAULT_WS_PATH = "/ws";

const BASELINE_VUS = Number(__ENV.BASELINE_VUS || 500);
const RAMP1_VUS = Number(__ENV.RAMP1_VUS || 1500);
const RAMP2_VUS = Number(__ENV.RAMP2_VUS || 3000);

const SESSION_MIN_SECONDS = Number(__ENV.SESSION_MIN_SECONDS || 480);
const SESSION_MAX_SECONDS = Number(__ENV.SESSION_MAX_SECONDS || 600);
const ATTEMPTS_PER_SECOND = Number(__ENV.ATTEMPTS_PER_SECOND || 3);

const CONNECT_TIMEOUT_MS = Number(__ENV.CONNECT_TIMEOUT_MS || 8000);
const LOBBY_POLL_MS = Number(__ENV.LOBBY_POLL_MS || 3000);
const GAME_POLL_MS = Number(__ENV.GAME_POLL_MS || 5000);
const START_WAIT_MS = Number(__ENV.START_WAIT_MS || 60000);
const DISABLE_POLLING = String(__ENV.DISABLE_POLLING || "0") === "1";
const CONNECT_STABILIZE_MS = Number(__ENV.CONNECT_STABILIZE_MS || 500);
const HEARTBEAT_MS = Number(__ENV.HEARTBEAT_MS || 15000);

const API_BASE_URL = (__ENV.API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
const WS_URL = __ENV.WS_URL || deriveWsUrl(API_BASE_URL, DEFAULT_WS_PATH);

const wsConnectTime = new Trend("ws_connect_time", true);
const wsConnectFailRate = new Rate("ws_connect_fail");

const KEY_SETS = [
  ["ctrl", "c"],
  ["ctrl", "v"],
  ["ctrl", "x"],
  ["ctrl", "z"],
  ["ctrl", "s"],
  ["ctrl", "p"],
  ["alt", "tab"],
  ["ctrl", "shift", "esc"],
  ["f4"],
  ["f11"],
];

export const options = {
  scenarios: {
    main: {
      executor: "ramping-vus",
      stages: loadStages(),
      gracefulRampDown: "5m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<300", "p(99)<1000"],
  },
};

function deriveWsUrl(apiBaseUrl, path) {
  try {
    const u = new URL(apiBaseUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return `${u.toString().replace(/\/+$/, "")}${path}`;
  } catch {
    return `ws://localhost:8000${path}`;
  }
}

function loadStages() {
  if (!__ENV.STAGES_JSON) {
    return defaultStages();
  }
  try {
    const parsed = JSON.parse(__ENV.STAGES_JSON);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // fall back to defaults
  }
  return defaultStages();
}

function defaultStages() {
  const spike1 = Math.round(RAMP1_VUS * 1.5);
  const spike2 = Math.round(RAMP2_VUS * 1.5);
  return [
    { duration: "10m", target: BASELINE_VUS },
    { duration: "20m", target: BASELINE_VUS },
    { duration: "20m", target: RAMP1_VUS },
    { duration: "5m", target: spike1 },
    { duration: "10m", target: RAMP1_VUS },
    { duration: "20m", target: RAMP2_VUS },
    { duration: "5m", target: spike2 },
    { duration: "10m", target: RAMP2_VUS },
    { duration: "10m", target: BASELINE_VUS },
  ];
}

function jsonHeaders() {
  return { headers: { "Content-Type": "application/json", Accept: "application/json" } };
}

function safeJson(res) {
  if (!res || res.body === null || res.body === undefined || res.body === "") {
    return null;
  }
  try {
    return res.json();
  } catch {
    return null;
  }
}

function getMessageEventName(msg) {
  if (!msg || typeof msg !== "object") {
    return null;
  }
  return typeof msg.type === "string" ? msg.type : typeof msg.event === "string" ? msg.event : null;
}

function mergeServerMessageBody(msg) {
  if (!msg || typeof msg !== "object") {
    return {};
  }
  const base = {};
  if (msg.payload && typeof msg.payload === "object") {
    Object.assign(base, msg.payload);
  }
  for (const [key, value] of Object.entries(msg)) {
    if (key === "v" || key === "type" || key === "event" || key === "payload") {
      continue;
    }
    base[key] = value;
  }
  return base;
}

function sendWsJson(socket, body) {
  try {
    socket.send(JSON.stringify({ v: 1, ...body }));
    return true;
  } catch {
    return false;
  }
}

function parseConnectPlayerId(msg) {
  if (!msg || typeof msg !== "object") {
    return null;
  }
  const ev = msg.event || msg.type;
  if (ev !== "connect") {
    return null;
  }
  if (typeof msg.player_id === "string") {
    return msg.player_id;
  }
  if (msg.payload && typeof msg.payload.player_id === "string") {
    return msg.payload.player_id;
  }
  return null;
}

function pickRandomKeySet() {
  const idx = Math.floor(Math.random() * KEY_SETS.length);
  return KEY_SETS[idx];
}

function getLeaderId(lobby) {
  if (!lobby || !Array.isArray(lobby.players)) {
    return null;
  }
  if (typeof lobby.leader_player_id === "string") {
    return lobby.leader_player_id;
  }
  if (typeof lobby.host_player_id === "string") {
    return lobby.host_player_id;
  }
  if (lobby.players.length > 0 && lobby.players[0].player_id) {
    return lobby.players[0].player_id;
  }
  return null;
}

function getObjectiveIndex(room, playerId) {
  if (!room || !room.game_state || !room.game_state.players) {
    return 0;
  }
  const p = room.game_state.players[playerId];
  if (!p || typeof p.objective_index !== "number") {
    return 0;
  }
  return p.objective_index;
}

function isFinished(room) {
  return Boolean(room && room.game_state && room.game_state.finished);
}

function apiUrl(path) {
  if (path.startsWith("/")) {
    return `${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/${path}`;
}

function getLobby(lobbyId) {
  const res = http.get(apiUrl(`/lobbies/${encodeURIComponent(lobbyId)}`));
  check(res, { "get lobby ok": (r) => r.status === 200 });
  return safeJson(res);
}

function patchPlayer(playerId, body) {
  const res = http.patch(
    apiUrl(`/players/${encodeURIComponent(playerId)}`),
    JSON.stringify(body),
    jsonHeaders(),
  );
  check(res, { "patch player ok": (r) => r.status === 200 });
  return safeJson(res);
}

function quickPlay(playerId) {
  const res = http.post(
    apiUrl("/lobbies/quick-play"),
    JSON.stringify({ player_id: playerId }),
    jsonHeaders(),
  );
  check(res, { "quick play ok": (r) => r.status === 200 || r.status === 201 });
  return safeJson(res);
}

function startLobby(lobbyId, playerId) {
  const res = http.post(
    apiUrl(`/lobbies/${encodeURIComponent(lobbyId)}/start`),
    JSON.stringify({ player_id: playerId }),
    jsonHeaders(),
  );
  check(res, { "start lobby ok": (r) => r.status === 200 || r.status === 201 });
  return safeJson(res);
}

function leaveLobby(lobbyId, playerId) {
  http.post(
    apiUrl(`/lobbies/${encodeURIComponent(lobbyId)}/leave`),
    JSON.stringify({ player_id: playerId }),
    jsonHeaders(),
  );
}

function getRoom(roomId) {
  const res = http.get(apiUrl(`/game-rooms/${encodeURIComponent(roomId)}`));
  check(res, { "get room ok": (r) => r.status === 200 });
  return safeJson(res);
}

function submitAttempt(roomId, body) {
  const res = http.post(
    apiUrl(`/game-rooms/${encodeURIComponent(roomId)}/attempts`),
    JSON.stringify(body),
    jsonHeaders(),
  );
  check(res, { "submit attempt ok": (r) => r.status === 200 || r.status === 201 });
  return safeJson(res);
}

function getResults(roomId, playerId) {
  const qs = playerId ? `?player_id=${encodeURIComponent(playerId)}` : "";
  const res = http.get(apiUrl(`/game-rooms/${encodeURIComponent(roomId)}/results${qs}`));
  check(res, { "get results ok": (r) => r.status === 200 });
  return safeJson(res);
}

export default function () {
  const connectStart = Date.now();
  ws.connect(WS_URL, {}, (socket) => {
    let playerId = null;
    let lobbyId = null;
    let roomId = null;
    let roomView = null;
    let lobbyView = null;
    let wsConnected = false;
    let socketOpen = true;
    let connectedAt = 0;
    let started = false;
    let heartbeatId = null;

    socket.on("message", (data) => {
      if (typeof data !== "string") return;
      let parsed = null;
      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }
      const ev = getMessageEventName(parsed);
      if (ev) {
        const body = mergeServerMessageBody(parsed);
        if (ev === "lobby_updated" || ev === "lobby_snapshot") {
          const payloadLobby =
            body.lobby && typeof body.lobby === "object" ? body.lobby : body;
          if (payloadLobby && typeof payloadLobby === "object") {
            lobbyView = payloadLobby;
            if (!lobbyId && typeof payloadLobby.id === "string") {
              lobbyId = payloadLobby.id;
            }
          }
        }
        if (ev === "room_snapshot") {
          if (!roomId && typeof body.room_id === "string") {
            roomId = body.room_id;
          }
          roomView = {
            id: String(body.room_id || body.id || roomId || ""),
            players: Array.isArray(body.players) ? body.players : [],
            locked: body.locked !== false,
            game_state: body.game_state || null,
          };
        } else if (ev === "game_state_update") {
          if (!roomId && typeof body.room_id === "string") {
            roomId = body.room_id;
          } else if (!roomId && lobbyId) {
            roomId = lobbyId;
          }
          if (roomView && body.game_state) {
            roomView = { ...roomView, game_state: body.game_state };
          }
        } else if (ev === "challenges") {
          if (!roomId && typeof body.room_id === "string") {
            roomId = body.room_id;
          } else if (!roomId && lobbyId) {
            roomId = lobbyId;
          }
          if (roomView && roomView.game_state && body.challenges) {
            roomView = {
              ...roomView,
              game_state: { ...roomView.game_state, challenges: body.challenges },
            };
          }
        }
      }
      const pid = parseConnectPlayerId(parsed);
      if (pid && !playerId) {
        playerId = pid;
        wsConnected = true;
        connectedAt = Date.now();
        wsConnectTime.add(Date.now() - connectStart);
      }
    });

    const intervalId = socket.setInterval(() => {
      if (!playerId) {
        if (Date.now() - connectStart > CONNECT_TIMEOUT_MS) {
          wsConnectFailRate.add(1);
          socket.close();
        }
        return;
      }

      if (started || !socketOpen || !wsConnected) return;
      if (Date.now() - connectedAt < CONNECT_STABILIZE_MS) return;
      started = true;

      wsConnectFailRate.add(0);

      const sessionMs = pickSessionDurationMs();
      if (socketOpen) {
        patchPlayer(playerId, { display_name: `load-${__VU}-${__ITER}` });
      }

      const lobby = quickPlay(playerId);
      lobbyId = lobby?.id || null;
      if (!lobbyId) {
        socket.close();
        return;
      }

      sendWsJson(socket, {
        type: "join_lobby",
        payload: { player_id: playerId, lobby_id: lobbyId },
      });

      let lobbyView = lobby;
      const leaderId = getLeaderId(lobbyView);
      const isLeader = leaderId === playerId;

      if (!isLeader && socketOpen) {
        patchPlayer(playerId, { is_ready: true });
      }

      const startDeadline = Date.now() + START_WAIT_MS;
      let startedRoom = null;

      while (Date.now() < startDeadline && !roomId) {
        if (!DISABLE_POLLING && lobbyId) {
          const latest = getLobby(lobbyId);
          if (latest) {
            lobbyView = latest;
          }
          if (lobbyView && lobbyView.game_room_id) {
            roomId = lobbyView.game_room_id;
            break;
          }
        }

        if (isLeader) {
          const view = lobbyView || lobby;
          if (view?.players?.length >= 2) {
            const nonLeaderReady = (view.players || [])
              .filter((p) => p.player_id !== playerId)
              .every((p) => p.is_ready === true);
            if (nonLeaderReady) {
              startedRoom = startLobby(lobbyId, playerId);
              const rid = startedRoom?.id || startedRoom?.room_id || startedRoom?.game_room_id;
              if (rid) {
                roomId = rid;
                break;
              }
            }
          }
        }

        sleep(LOBBY_POLL_MS / 1000);
      }

      if (!roomId) {
        leaveLobby(lobbyId, playerId);
        socket.close();
        return;
      }

      sendWsJson(socket, {
        type: "join_room",
        payload: { player_id: playerId, room_id: roomId },
      });

      roomView = getRoom(roomId);
      let lastRoomPoll = Date.now();
      let lastAttemptAt = 0;
      const attemptIntervalMs = Math.max(200, Math.floor(1000 / ATTEMPTS_PER_SECOND));
      const sessionEnd = Date.now() + sessionMs;

      while (Date.now() < sessionEnd) {
        const now = Date.now();
        if (!wsConnected && now - lastRoomPoll >= 2000) {
          roomView = getRoom(roomId);
          lastRoomPoll = now;
        }

        if (isFinished(roomView)) {
          break;
        }

        if (now - lastAttemptAt >= attemptIntervalMs) {
          const objectiveIndex = getObjectiveIndex(roomView, playerId);
          submitAttempt(roomId, {
            player_id: playerId,
            objective_index: objectiveIndex,
            keys: pickRandomKeySet(),
            attempt_id: `load-${__VU}-${__ITER}-${now}`,
          });
          lastAttemptAt = now;
        }

        sleep(0.1);
      }

      getResults(roomId, playerId);
      if (lobbyId) {
        leaveLobby(lobbyId, playerId);
      }

      socket.close();
    }, 200);

    heartbeatId = socket.setInterval(() => {
      if (socketOpen && wsConnected) {
        sendWsJson(socket, { type: "ping", payload: { ts: Date.now() } });
      }
    }, HEARTBEAT_MS);

    socket.on("close", () => {
      socketOpen = false;
      clearInterval(intervalId);
      if (heartbeatId !== null) {
        clearInterval(heartbeatId);
      }
    });
  });
}

function pickSessionDurationMs() {
  const min = Math.max(30, SESSION_MIN_SECONDS);
  const max = Math.max(min, SESSION_MAX_SECONDS);
  const seconds = Math.floor(min + Math.random() * (max - min + 1));
  return seconds * 1000;
}
