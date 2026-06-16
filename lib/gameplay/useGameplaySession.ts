"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { getGameRoom, submitGameAttempt } from "@/lib/api/gameRooms";
import type { GameRoomView, GameStateView } from "@/lib/api/types";
import { formatApiErrorForUi } from "@/lib/api/errors";
import { getMessageEventName, mergeServerMessageBody } from "@/lib/realtime/wsMessages";
import { usePlayerConnection, useWebSocketMessageListener } from "@/lib/realtime/playerConnection";
import { keysFromKeyboardEvent, keysFromTextEntry } from "@/lib/gameplay/keysFromKeyboard";
import { mergeGameStateView } from "@/lib/gameplay/mergeGameStateView";
import { remainingRoundSeconds } from "@/lib/gameplay/remainingSeconds";

export type GameplaySyncMode = "realtime" | "polling" | "reconnecting";

export type UseGameplaySessionOptions = {
  roomId: string;
  playerId: string | null;
  onRoundFinished: (context: { roomId: string; playerId: string | null }) => void;
};

function readGameState(body: Record<string, unknown>): GameStateView | null {
  const gs = body.game_state;
  if (typeof gs === "object" && gs !== null) {
    return gs as GameStateView;
  }
  return null;
}

export function useGameplaySession({
  roomId,
  playerId,
  onRoundFinished,
}: UseGameplaySessionOptions) {
  const { status, sendWebSocketJson } = usePlayerConnection();
  const [roomView, setRoomView] = useState<GameRoomView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallMsAtSync, setWallMsAtSync] = useState(() => Date.now());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [attemptInFlight, setAttemptInFlight] = useState(false);
  const navigatedRef = useRef(false);
  const onRoundFinishedRef = useRef(onRoundFinished);
  useEffect(() => {
    onRoundFinishedRef.current = onRoundFinished;
  }, [onRoundFinished]);

  const applySnapshot = useCallback((gr: GameRoomView) => {
    setRoomView((prev) => {
      if (prev && prev.id !== gr.id) {
        return gr;
      }
      if (!prev) {
        return gr;
      }
      const nextGs = mergeGameStateView(prev.game_state, gr.game_state);
      return { ...gr, game_state: nextGs };
    });
    setWallMsAtSync(Date.now());
  }, []);

  const applyGameState = useCallback(
    (gs: GameStateView, options?: { room?: Partial<GameRoomView> }) => {
      setRoomView((prev) => {
        if (!prev) {
          return {
            id: roomId,
            players: options?.room?.players ?? Object.keys(gs.players ?? {}),
            locked: options?.room?.locked ?? true,
            game_state: mergeGameStateView(null, gs),
          };
        }
        const nextGs = mergeGameStateView(prev.game_state, gs);
        return { ...prev, ...options?.room, game_state: nextGs };
      });
      setWallMsAtSync(Date.now());
    },
    [roomId],
  );

  const submitKeys = useCallback(
    async (
      keys: string[],
      objectiveIndex: number,
    ): Promise<{ ok: boolean; message?: string }> => {
      if (!playerId) {
        return { ok: false, message: "Not signed in" };
      }
      if (navigatedRef.current) {
        return { ok: false, message: "Match over" };
      }
      setSubmitError(null);
      setAttemptInFlight(true);
      const attemptId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `attempt-${Date.now()}`;

      try {
        const res = await submitGameAttempt(roomId, {
          player_id: playerId,
          objective_index: objectiveIndex,
          keys,
          attempt_id: attemptId,
        });
        if (res.accepted) {
          applyGameState(res.game_state);
          if (res.skipped) {
            const m = "Skipped";
            setSubmitError(m);
            return { ok: true, message: m };
          }
          if (res.correct === false) {
            const m = "Incorrect";
            setSubmitError(m);
            return { ok: true, message: m };
          }
          setSubmitError(null);
          return { ok: true };
        }
        const msg = res.reason?.replace(/_/g, " ") ?? "Try again.";
        setSubmitError(msg);
        if (res.game_state) {
          applyGameState(res.game_state);
        }
        return { ok: false, message: msg };
      } catch (e) {
        const msg = formatApiErrorForUi(e);
        setSubmitError(msg);
        return { ok: false, message: msg };
      } finally {
        setAttemptInFlight(false);
      }
    },
    [applyGameState, playerId, roomId],
  );

  const loadRoom = useCallback(
    async (mode: "initial" | "poll") => {
      try {
        const gr = await getGameRoom(roomId);
        if (mode === "initial") {
          setLoadError(null);
        }
        applySnapshot(gr);
      } catch (e) {
        if (mode === "initial") {
          setLoadError(formatApiErrorForUi(e));
        }
      } finally {
        if (mode === "initial") {
          setLoading(false);
        }
      }
    },
    [applySnapshot, roomId],
  );

  useEffect(() => {
    navigatedRef.current = false;
    const initialLoad = window.setTimeout(() => {
      setLoading(true);
      setRoomView(null);
      setLoadError(null);
      void loadRoom("initial");
    }, 0);
    return () => {
      window.clearTimeout(initialLoad);
    };
  }, [loadRoom, roomId]);

  useWebSocketMessageListener(
    useCallback(
      (data: unknown) => {
        const name = getMessageEventName(data);
        if (name === "connect" || !name) {
          return;
        }
        const body = mergeServerMessageBody(data);
        const rId =
          (typeof body.room_id === "string" && body.room_id) || undefined;
        if (rId && rId !== roomId) {
          return;
        }
        if (name === "room_snapshot") {
          const gs = readGameState(body);
          if (gs) {
            const pl = body.players;
            const players = Array.isArray(pl)
              ? (pl as string[]).map(String)
              : Object.keys(gs.players);
            setRoomView({
              id: String(body.room_id ?? roomId),
              players,
              locked: body.locked !== false,
              game_state: mergeGameStateView(null, gs),
            });
            setWallMsAtSync(Date.now());
          }
          return;
        }
        if (name === "game_state_update") {
          const gs = readGameState(body);
          if (gs) {
            applyGameState(gs);
          }
        }
        if (name === "challenges" && "challenges" in body) {
          setRoomView((prev) => {
            if (!prev) {
              return prev;
            }
            return {
              ...prev,
              game_state: {
                ...prev.game_state,
                challenges:
                  (body.challenges as GameStateView["challenges"]) ?? [],
              },
            };
          });
        }
      },
      [applyGameState, roomId],
    ),
  );

  useEffect(() => {
    if (!roomView?.game_state.finished) {
      return;
    }
    if (navigatedRef.current) {
      return;
    }
    navigatedRef.current = true;
    onRoundFinishedRef.current({ roomId: roomView.id, playerId });
  }, [roomView, playerId, roomId]);

  const syncMode: GameplaySyncMode = useMemo(() => {
    if (status === "reconnecting" || status === "connecting") {
      return "reconnecting";
    }
    if (status === "connected") {
      return "realtime";
    }
    return "polling";
  }, [status]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setTick((n) => n + 1);
    }, 500);
    return () => {
      window.clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!roomId) {
      return;
    }
    if (status === "connected") {
      return;
    }
    const id = window.setInterval(() => {
      void loadRoom("poll");
    }, 2000);
    return () => {
      window.clearInterval(id);
    };
  }, [loadRoom, roomId, status]);

  const gameState = roomView?.game_state ?? null;

  const timeLeftSec = useMemo(() => {
    if (!gameState) {
      return 0;
    }
    void tick;
    return remainingRoundSeconds(gameState, wallMsAtSync);
  }, [gameState, wallMsAtSync, tick]);

  const currentChallenge = useMemo(() => {
    if (!gameState || !playerId) {
      return null;
    }
    const p = gameState.players[playerId];
    if (!p) {
      return null;
    }
    const idx = p.objective_index;
    return gameState.challenges.find((c) => c.index === idx) ?? null;
  }, [gameState, playerId]);

  const hasNoMoreChallenges = useMemo(() => {
    if (!gameState || !playerId) {
      return false;
    }
    const p = gameState.players[playerId];
    if (!p) {
      return false;
    }
    return (
      !gameState.finished &&
      gameState.objective_count > 0 &&
      p.objective_index >= gameState.objective_count
    );
  }, [gameState, playerId]);

  const myProgress = useMemo(() => {
    if (!gameState || !playerId) {
      return null;
    }
    return gameState.players[playerId] ?? null;
  }, [gameState, playerId]);

  const trySubmitKeys = useCallback(
    async (
      event: KeyboardEvent<HTMLInputElement>,
    ): Promise<{ ok: boolean; message?: string } | null> => {
      if (!roomView || !playerId || !gameState) {
        return null;
      }
      if (navigatedRef.current || gameState.finished) {
        return null;
      }
      const prog = gameState.players[playerId];
      if (!prog) {
        return null;
      }
      if (event.key === "Enter") {
        return null;
      }
      const hasMod = event.ctrlKey || event.metaKey || event.altKey;
      const isFunctionKey = /^f\d{1,2}$/i.test(event.key);
      if (hasMod || isFunctionKey) {
        event.preventDefault();
      }
      const k0 = event.key.toLowerCase();
      if (!hasMod && k0.length === 1 && k0 >= "a" && k0 <= "z") {
        return null;
      }
      const objIdx = prog.objective_index;
      if (objIdx < 0 || objIdx >= (gameState.objective_count || 0)) {
        return null;
      }
      const keys = keysFromKeyboardEvent(
        event as unknown as globalThis.KeyboardEvent,
      );
      if (keys.length < 1) {
        return null;
      }
      return submitKeys(keys, objIdx);
    },
    [gameState, playerId, roomView, submitKeys],
  );

  const trySubmitText = useCallback(
    async (entry: string) => {
      if (!roomView || !playerId || !gameState) {
        return { ok: false, message: "Not ready" };
      }
      if (navigatedRef.current || gameState.finished) {
        return { ok: false, message: "Match over" };
      }
      const prog = gameState.players[playerId];
      if (!prog) {
        return { ok: false, message: "Not in room" };
      }
      const objIdx = prog.objective_index;
      if (objIdx < 0) {
        return { ok: false, message: "No objective" };
      }
      const keys = keysFromTextEntry(entry);
      if (keys.length < 1) {
        return { ok: false, message: "Type a shortcut" };
      }
      return submitKeys(keys, objIdx);
    },
    [gameState, playerId, roomView, submitKeys],
  );

  const onReconnectSync = useCallback(() => {
    sendWebSocketJson({
      event: "sync_state",
      type: "sync_state",
      room_id: roomId,
    });
  }, [roomId, sendWebSocketJson]);

  return {
    roomView,
    gameState,
    loading,
    loadError,
    submitError,
    timeLeftSec,
    currentChallenge,
    hasNoMoreChallenges,
    myProgress,
    trySubmitKeys,
    trySubmitText,
    attemptInFlight,
    syncMode,
    onReconnectSync,
    lastSyncedAtMs: wallMsAtSync,
  };
}
