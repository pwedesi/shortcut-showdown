"use client";

import {
  IconCheck,
  IconClock,
  IconCopy,
  IconFlame,
  IconLayoutGrid,
  IconPlayerPlayFilled,
  IconMinus,
  IconPlus,
  IconAdjustments,
  IconUser,
  IconUsersGroup,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getLobby,
  joinLobby,
  kickPlayer,
  leaveLobby,
  lockLobby,
  quickPlay,
  setChallengeCount,
  setMaxPlayers,
  setRoundDuration,
  startLobby,
  unlockLobby,
  updatePlayerDisplayName,
  updatePlayerReadyStatus,
  type Lobby,
} from "@/lib/api";
import { formatApiErrorForUi } from "@/lib/api/errors";
import { loadCallsignFromStorage } from "@/lib/callsign";
import { copyTextToClipboard } from "@/lib/browser";
import {
  getLobbyAccessDisplay,
  getLobbyIdFromSearchParams,
  getLobbyLeaderPlayerId,
  getLobbyMaxPlayers,
  hasServerShareCode,
  lobbyHasPlayer,
  normalizeLobbyFromApi,
  shortPlayerId,
} from "@/lib/lobby";
import {
  usePlayerConnection,
  useWebSocketMessageListener,
} from "@/lib/realtime/playerConnection";
import {
  getMessageEventName,
  mergeServerMessageBody,
} from "@/lib/realtime/wsMessages";
import { cn } from "@/lib/utils";

const POLL_MS = 3_000;

/** Lobby shell — dark graphite + #ff8c00 accent. */
const shell = {
  bg: "bg-[#0a0a0a]",
  card: "border border-white/8 bg-[#141414] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  muted: "text-[#888888]",
  accent: "text-[#ff8c00]",
};

function LobbyShell({
  children,
  headerExtra,
  connLine,
  onLeave,
  leaveDisabled,
}: {
  children: ReactNode;
  headerExtra: ReactNode;
  connLine: string;
  onLeave: () => void;
  leaveDisabled: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-svh flex-col overflow-hidden text-[#e8e6e4]",
        shell.bg,
      )}
    >
      <header
        className={cn(
          "relative z-50 flex w-full max-w-none items-center justify-between",
          "border-b border-white/6 bg-[#0a0a0a]/90 px-5 py-4 backdrop-blur-xl md:px-8",
          "shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
        )}
      >
        <div className="flex items-center gap-6 md:gap-10">
          <div
            className={cn(
              "select-none whitespace-nowrap text-lg font-black italic tracking-tight",
              "text-[#ff8c00] drop-shadow-[0_0_18px_rgba(255,140,0,0.35)]",
              "sm:text-xl md:text-2xl",
            )}
          >
            SHORTCUT SHOWDOWN
          </div>
          <span className="hidden font-mono text-[10px] text-[#666] md:block">
            {headerExtra}
          </span>
          <nav className="hidden gap-1 text-[11px] font-bold tracking-[0.2em] md:flex">
            <span
              className={cn(
                "rounded px-3 py-2",
                shell.accent,
                "bg-[#ff8c00]/8 shadow-[inset_0_-2px_0_#ff8c00]",
              )}
            >
              MULTIPLAYER
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#ff8c00]">
          <span className="hidden max-w-56 truncate font-mono text-[10px] text-[#888] md:block">
            {connLine}
          </span>
          <button
            type="button"
            onClick={onLeave}
            disabled={leaveDisabled}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-bold tracking-wider text-[#e8e6e4] transition-colors hover:bg-white/6 disabled:opacity-50"
          >
            Leave
          </button>
          {/* Settings and notifications removed (non-functional) */}
        </div>
      </header>
      {children}
    </div>
  );
}

function LobbyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, playerId, lastError, reconnect } = usePlayerConnection();

  const lobbyIdParam = getLobbyIdFromSearchParams(searchParams);
  const [callsign, setCallsign] = useState("");
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [startBusy, setStartBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [readyBusy, setReadyBusy] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);
  const [quickPlayBusy, setQuickPlayBusy] = useState(false);
  const [kickBusyPlayerId, setKickBusyPlayerId] = useState<string | null>(null);
  const [lastPoll, setLastPoll] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [lastCopyText, setLastCopyText] = useState<string | null>(null);
  const autoJoinAttemptedRef = useRef(false);
  const navigatedToGameplayRef = useRef(false);
  const hadJoinedRef = useRef(false);
  const removedFromLobbyRef = useRef(false);

  const lobbyId = lobby?.id ?? lobbyIdParam;

  useEffect(() => {
    autoJoinAttemptedRef.current = false;
  }, [lobbyIdParam]);

  useEffect(() => {
    navigatedToGameplayRef.current = false;
  }, [lobbyIdParam]);

  useEffect(() => {
    if (!lobbyIdParam) {
      removedFromLobbyRef.current = false;
      hadJoinedRef.current = false;
    }
  }, [lobbyIdParam]);

  useEffect(() => {
    setCallsign(loadCallsignFromStorage());
  }, []);

  /**
   * Send the player's callsign to the backend whenever they have a player ID.
   * This ensures other players see the player's display name instead of just their ID.
   */
  useEffect(() => {
    if (!playerId || !callsign.trim()) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await updatePlayerDisplayName(playerId, callsign.trim());
      } catch (e) {
        // Silently fail; this is best-effort. Connection/validation errors
        // won't prevent the player from participating.
        if (!cancelled) {
          console.debug("Failed to update player display name:", e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playerId, callsign]);

  const copyLink = useCallback(async () => {
    if (!lobbyId) return;
    setCopyError(null);
    const idOnly = lobbyId.trim();
    setLastCopyText(idOnly);
    const ok = await copyTextToClipboard(idOnly);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError(
        "Could not copy automatically. Select the text in the field below and copy (⌘C / Ctrl+C).",
      );
    }
  }, [lobbyId]);

  const refresh = useCallback(async () => {
    if (!lobbyIdParam) return;
    setFetchError(null);
    try {
      const next = await getLobby(lobbyIdParam);
      setLobby(next);
      setLastPoll(Date.now());
    } catch (e) {
      setFetchError(formatApiErrorForUi(e));
    }
  }, [lobbyIdParam]);

  useEffect(() => {
    if (!lobbyIdParam) return;
    void refresh();
    if (status === "connected") {
      return;
    }
    const t = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(t);
  }, [lobbyIdParam, refresh, status]);

  /**
   * Invite links open `/lobby?id=…` without home "Join". Register this client via POST /join
   * once and stay on `/lobby` (does not navigate to gameplay).
   */
  useEffect(() => {
    if (!lobbyIdParam || !playerId || !lobby) return;
    if (removedFromLobbyRef.current) return;
    if (hadJoinedRef.current) return;
    if (lobbyHasPlayer(lobby, playerId)) return;
    if (autoJoinAttemptedRef.current) return;
    autoJoinAttemptedRef.current = true;

    let cancelled = false;
    void (async () => {
      try {
        await joinLobby(lobbyIdParam, { player_id: playerId });
        if (!cancelled) await refresh();
      } catch (e) {
        if (!cancelled) {
          setActionError(formatApiErrorForUi(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lobbyIdParam, playerId, lobby, refresh]);

  useEffect(() => {
    if (!lobby || !playerId) return;
    const inLobby = lobbyHasPlayer(lobby, playerId);
    if (inLobby) {
      hadJoinedRef.current = true;
      return;
    }
    if (!hadJoinedRef.current || removedFromLobbyRef.current) return;
    removedFromLobbyRef.current = true;
    setActionError("You were removed from the lobby.");
    const t = window.setTimeout(() => {
      router.push("/");
    }, 1200);
    return () => window.clearTimeout(t);
  }, [lobby, playerId, router]);

  const navigateToGameplayForRoom = useCallback(
    (room: string) => {
      const r = room.trim();
      if (!r) {
        return;
      }
      const lid = lobbyId ?? "";
      if (!lid) {
        return;
      }
      if (navigatedToGameplayRef.current) {
        return;
      }
      navigatedToGameplayRef.current = true;
      router.push(
        `/gameplay?room=${encodeURIComponent(r)}&lobby=${encodeURIComponent(lid)}`,
      );
    },
    [lobbyId, router],
  );

  useEffect(() => {
    if (!lobby?.game_room_id) {
      return;
    }
    navigateToGameplayForRoom(lobby.game_room_id);
  }, [lobby?.game_room_id, navigateToGameplayForRoom]);

  useWebSocketMessageListener(
    useCallback(
      (data: unknown) => {
        if (navigatedToGameplayRef.current) {
          return;
        }
        const name = getMessageEventName(data);
        if (name === "connect" || !name) {
          return;
        }
        if (name === "kicked_from_lobby") {
          const body = mergeServerMessageBody(data);
          const lid = typeof body.lobby_id === "string" ? body.lobby_id : undefined;
          if (lid && (lobbyIdParam ?? lobbyId) === lid) {
            // Mark removal and show immediate feedback, then navigate home
            removedFromLobbyRef.current = true;
            setActionError((body && typeof body.message === "string") ? body.message : "You were removed from the lobby.");
            window.setTimeout(() => router.push("/"), 800);
          }
          return;
        }
        if (name === "lobby_updated" || name === "lobby_snapshot") {
          const body = mergeServerMessageBody(data);
          const payloadLobby =
            typeof body.lobby === "object" && body.lobby !== null
              ? body.lobby
              : body;
          const next = normalizeLobbyFromApi(payloadLobby);
          const nextId = next.id.trim();
          const expected = lobbyIdParam ?? lobbyId ?? "";
          if (nextId && expected && nextId !== expected) {
            return;
          }
          if (nextId) {
            setLobby(next);
            setLastPoll(Date.now());
          }
          return;
        }
        if (
          name !== "room_snapshot" &&
          name !== "challenges" &&
          name !== "game_state_update"
        ) {
          return;
        }
        const body = mergeServerMessageBody(data);
        const room =
          (typeof body.room_id === "string" && body.room_id.trim()) ||
          (name === "room_snapshot" && typeof body.id === "string"
            ? body.id.trim()
            : "");
        if (!room) {
          return;
        }
        const gs = body.game_state;
        if (name === "room_snapshot") {
          if (typeof gs !== "object" || gs === null) {
            return;
          }
        } else if (name === "challenges") {
          if (
            !("challenges" in body) &&
            (typeof gs !== "object" || gs === null)
          ) {
            return;
          }
        } else if (typeof gs !== "object" || gs === null) {
          return;
        }
        navigateToGameplayForRoom(room);
      },
      [lobbyIdParam, lobbyId, navigateToGameplayForRoom],
    ),
  );

  const onStart = useCallback(async () => {
    if (!lobbyId || !playerId) {
      setActionError("Not ready to start. Check connection and lobby id.");
      return;
    }
    if (!lobby || getLobbyLeaderPlayerId(lobby) !== playerId) {
      setActionError("Only the room leader can start the match.");
      return;
    }
    const leader = getLobbyLeaderPlayerId(lobby);
    const waitingPeer = lobby.players.some(
      (p) => p.player_id !== leader && p.is_ready !== true,
    );
    if (waitingPeer) {
      setActionError("All non-leader players must be ready before starting.");
      return;
    }
    setActionError(null);
    setStartBusy(true);
    try {
      const res = await startLobby(lobbyId, { player_id: playerId });
      const room =
        (typeof res.id === "string" && res.id) ||
        (typeof res.room_id === "string" && res.room_id) ||
        (typeof res.game_room_id === "string" && res.game_room_id) ||
        "";
      if (room) {
        navigateToGameplayForRoom(room);
      } else {
        navigatedToGameplayRef.current = true;
        router.push(`/gameplay?lobby=${encodeURIComponent(lobbyId)}`);
      }
    } catch (e) {
      setActionError(formatApiErrorForUi(e));
    } finally {
      setStartBusy(false);
    }
  }, [lobbyId, playerId, lobby, navigateToGameplayForRoom, router]);

  const onLeave = useCallback(async () => {
    if (!lobbyId || !playerId) {
      router.push("/");
      return;
    }
    setLeaveBusy(true);
    try {
      await leaveLobby(lobbyId, { player_id: playerId });
    } catch {
      // still go home; server may be unreachable
    } finally {
      setLeaveBusy(false);
      router.push("/");
    }
  }, [lobbyId, playerId, router]);

  const onToggleReady = useCallback(async () => {
    if (!playerId) {
      setActionError("Waiting for player id from realtime connection.");
      return;
    }
    const currentPlayer = lobby?.players.find((p) => p.player_id === playerId);
    const nextReady = !currentPlayer?.is_ready;
    setActionError(null);
    // Optimistic update so the button/row reacts immediately.
    setLobby((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map((p) =>
          p.player_id === playerId ? { ...p, is_ready: nextReady } : p,
        ),
      };
    });
    setReadyBusy(true);
    try {
      await updatePlayerReadyStatus(playerId, nextReady);
      // Refresh lobby to get updated status
      if (lobbyIdParam) {
        await refresh();
      }
    } catch (e) {
      setActionError(formatApiErrorForUi(e));
      // Roll forward from server truth after an API failure.
      if (lobbyIdParam) {
        await refresh();
      }
    } finally {
      setReadyBusy(false);
    }
  }, [playerId, lobby, lobbyIdParam, refresh]);

  const onToggleLock = useCallback(async () => {
    if (!lobbyId || !playerId) {
      setActionError("Waiting for player id or lobby id.");
      return;
    }
    setActionError(null);
    setLockBusy(true);
    try {
      const isCurrentlyLocked = lobby?.locked ?? false;
      if (isCurrentlyLocked) {
        await unlockLobby(lobbyId, { player_id: playerId });
      } else {
        await lockLobby(lobbyId, { player_id: playerId });
      }
      if (lobbyIdParam) {
        // Wait for refresh to complete before clearing busy state
        await refresh();
      }
    } catch (e) {
      setActionError(formatApiErrorForUi(e));
      setLockBusy(false);
    } finally {
      if (!lobbyIdParam) {
        setLockBusy(false);
      } else {
        // Delay clearing busy state slightly to let state update render
        setTimeout(() => setLockBusy(false), 100);
      }
    }
  }, [lobbyId, playerId, lobby, lobbyIdParam, refresh]);

  const onSetMaxPlayers = useCallback(
    async (delta: number) => {
      if (!lobbyId || !playerId || !lobby) return;
      const current = lobby.max_players ?? 4;
      const next = current + delta;
      if (next < 1 || next > 20) return;
      if (next < lobby.players.length && delta < 0) {
        setActionError(
          `Cannot reduce max players below current member count (${lobby.players.length}).`,
        );
        return;
      }
      setActionError(null);
      try {
        await setMaxPlayers(lobbyId, {
          player_id: playerId,
          max_players: next,
        });
        await refresh();
      } catch (e) {
        setActionError(formatApiErrorForUi(e));
      }
    },
    [lobbyId, playerId, lobby, refresh],
  );

  const onSetChallengeCount = useCallback(
    async (delta: number) => {
      if (!lobbyId || !playerId || !lobby) return;
      const current = lobby.challenge_count ?? 10;
      const next = current + delta;
      if (next < 1 || next > 100) return;
      setActionError(null);
      try {
        await setChallengeCount(lobbyId, {
          player_id: playerId,
          challenge_count: next,
        });
        await refresh();
      } catch (e) {
        setActionError(formatApiErrorForUi(e));
      }
    },
    [lobbyId, playerId, lobby, refresh],
  );

  const onSetRoundDuration = useCallback(
    async (delta: number) => {
      if (!lobbyId || !playerId || !lobby) return;
      const current = lobby.round_duration_seconds ?? 90;
      const next = current + delta;
      if (next < 10 || next > 600) return;
      setActionError(null);
      try {
        await setRoundDuration(lobbyId, {
          player_id: playerId,
          round_duration_seconds: next,
        });
        await refresh();
      } catch (e) {
        setActionError(formatApiErrorForUi(e));
      }
    },
    [lobbyId, playerId, lobby, refresh],
  );

  const onQuickPlay = useCallback(async () => {
    if (!playerId) {
      setActionError("Waiting for player id from realtime connection.");
      return;
    }
    setActionError(null);
    setQuickPlayBusy(true);
    try {
      const newLobby = await quickPlay({ player_id: playerId });
      router.push(`/lobby?id=${encodeURIComponent(newLobby.id)}`);
    } catch (e) {
      setActionError(formatApiErrorForUi(e));
      setQuickPlayBusy(false);
    }
  }, [playerId, router]);

  const onKickPlayer = useCallback(
    async (targetPlayerId: string) => {
      if (!lobbyId || !playerId) {
        setActionError("Waiting for player id or lobby id.");
        return;
      }
      if (!lobby || getLobbyLeaderPlayerId(lobby) !== playerId) {
        setActionError("Only the room leader can kick players.");
        return;
      }
      if (targetPlayerId === playerId) {
        return;
      }
      setActionError(null);
      setKickBusyPlayerId(targetPlayerId);
      try {
        await kickPlayer(lobbyId, {
          player_id: playerId,
          target_player_id: targetPlayerId,
        });
        await refresh();
      } catch (e) {
        setActionError(formatApiErrorForUi(e));
      } finally {
        setKickBusyPlayerId((prev) => (prev === targetPlayerId ? null : prev));
      }
    },
    [lobbyId, playerId, lobby, refresh],
  );

  if (!lobbyIdParam) {
    return (
      <LobbyShell
        headerExtra="No lobby"
        connLine="—"
        onLeave={() => {
          router.push("/");
        }}
        leaveDisabled={false}
      >
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-center text-[#c45c4a]">
            Missing lobby. Open a link with{" "}
            <span className="font-mono">?id=</span> or{" "}
            <span className="font-mono">?code=</span>.
          </p>
        </main>
      </LobbyShell>
    );
  }

  const maxP = getLobbyMaxPlayers(lobby);
  const count = lobby?.players?.length ?? 0;
  const leaderId = lobby ? getLobbyLeaderPlayerId(lobby) : null;
  const isRoomLeader = Boolean(playerId && leaderId && playerId === leaderId);
  const nonLeaderPlayers = (lobby?.players ?? []).filter(
    (p) => p.player_id !== leaderId,
  );
  const allNonLeadersReady = nonLeaderPlayers.every((p) => p.is_ready === true);
  const myRosterEntry = (lobby?.players ?? []).find(
    (p) => p.player_id === playerId,
  );
  const isMeReady = Boolean(myRosterEntry?.is_ready);
  const access = getLobbyAccessDisplay(lobby, lobbyIdParam);
  const accessHeroIsLong = access.length > 12;
  const accessLabel = hasServerShareCode(lobby) ? "ACCESS CODE" : "LOBBY ID";
  const connLine =
    status === "connected" && lastPoll
      ? `Poll ${new Date(lastPoll).toLocaleTimeString()} · RT: ${status}`
      : status === "reconnecting" || status === "connecting"
        ? "Realtime: connecting…"
        : `Realtime: ${status}${lastError ? ` · ${lastError}` : ""}`;

  const roster = lobby?.players ?? [];
  const rosterNames = roster.map((p) => {
    const isYou = playerId != null && p.player_id === playerId;
    const base =
      isYou && callsign.trim()
        ? callsign.trim()
        : p.display_name && p.display_name.trim()
          ? p.display_name.trim()
          : `Player ${shortPlayerId(p.player_id)}`;
    return { playerId: p.player_id, base, isYou };
  });
  const nameCounts = new Map<string, number>();
  rosterNames.forEach(({ base }) => {
    const key = base.toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  });

  return (
    <LobbyShell
      headerExtra={lobby ? `Status: ${lobby.status}` : "…"}
      connLine={connLine}
      onLeave={onLeave}
      leaveDisabled={leaveBusy}
    >
      <main className="relative z-10 flex min-w-0 flex-1 justify-center overflow-x-hidden overflow-y-auto px-4 pb-36 pt-8 md:px-8 md:pb-28 md:pt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid-home opacity-[0.12]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-10%] top-[-5%] h-[min(70vh,520px)] w-[min(70vw,520px)] rounded-full bg-[#ff8c00]/6 blur-[120px]"
        />

        {fetchError && (
          <div
            role="alert"
            className="absolute left-1/2 top-4 z-20 w-[min(32rem,90vw)] -translate-x-1/2 rounded-sm border border-[#c45c4a]/50 bg-[#2a1111] px-4 py-2 text-sm text-[#f0c0b8]"
          >
            {fetchError}
          </div>
        )}
        {actionError && (
          <div
            role="alert"
            className="absolute left-1/2 top-16 z-20 w-[min(32rem,90vw)] -translate-x-1/2 rounded-sm border border-[#c45c4a]/50 bg-[#2a1111] px-4 py-2 text-sm text-[#f0c0b8] md:top-4"
          >
            {actionError}
          </div>
        )}

        <div className="relative grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-4">
            <div
              className={cn(
                "relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden p-8 md:min-h-[240px]",
                shell.card,
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/6 to-transparent opacity-30"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full bg-linear-to-r from-transparent via-[#ff8c00] to-transparent shadow-[0_0_12px_rgba(255,140,0,0.5)]"
              />
              <div className="relative z-10 flex w-full max-w-full flex-col items-center">
                <span
                  className={cn(
                    "mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.35em]",
                    shell.accent,
                  )}
                >
                  {accessLabel}
                </span>
                <h1
                  className={cn(
                    "max-w-full wrap-break-word text-center font-black text-white",
                    accessHeroIsLong
                      ? "font-mono text-base font-bold leading-snug tracking-tight sm:text-lg md:text-xl"
                      : "font-sans text-4xl tracking-[-0.06em] sm:text-6xl md:text-8xl",
                  )}
                >
                  {lobby ? access : "…"}
                </h1>
                {lobby && accessHeroIsLong ? (
                  <p
                    className={cn(
                      "mt-3 max-w-xs text-center font-sans text-[10px] leading-relaxed tracking-wide",
                      shell.muted,
                    )}
                  >
                    On the home screen, paste this id in Join, or open this
                    page’s URL in the browser — short snippets of the id are not
                    valid.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={copyLink}
                  className={cn(
                    "group relative z-10 mt-8 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-sm px-3 py-2.5 transition-colors",
                    "text-[#ff8c00] hover:bg-[#ff8c00]/10 hover:text-[#ffb366]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8c00]",
                  )}
                >
                  <span className="flex size-8 items-center justify-center rounded border border-[#ff8c00]/40 bg-[#ff8c00]/7 transition-transform group-hover:border-[#ff8c00]/60">
                    <IconCopy className="size-4" stroke={1.5} aria-hidden />
                  </span>
                  <span className="text-xs font-bold tracking-[0.25em]">
                    {copied ? "COPIED" : "COPY ID"}
                  </span>
                </button>
                {copyError && lastCopyText ? (
                  <div className="mt-3 w-full max-w-[min(100%,20rem)] px-1">
                    <p className="mb-1.5 text-center text-[10px] leading-relaxed text-[#e8a090]">
                      {copyError}
                    </p>
                    <input
                      type="text"
                      readOnly
                      aria-label="Lobby id to copy"
                      className="w-full cursor-text select-all rounded-sm border border-white/10 bg-[#0a0a0a] px-2 py-2 font-mono text-[10px] text-[#e8e6e4] focus:border-[#ff8c00]/50 focus:outline-none"
                      value={lastCopyText}
                      onClick={(e) => e.currentTarget.select()}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className={cn("flex flex-col gap-5 p-6 md:p-7", shell.card)}>
              <h2
                className={cn(
                  "flex items-center gap-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.3em]",
                  shell.accent,
                )}
              >
                <IconAdjustments className="size-5 shrink-0" stroke={1.5} />
                PARAMETERS
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <ParamCell
                  label="CHALLENGES"
                  value={
                    lobby?.challenge_count != null
                      ? String(lobby.challenge_count)
                      : "…"
                  }
                  onIncrement={
                    isRoomLeader ? () => onSetChallengeCount(1) : undefined
                  }
                  onDecrement={
                    isRoomLeader ? () => onSetChallengeCount(-1) : undefined
                  }
                />
                <ParamCell
                  label="MAX PLAYERS"
                  value={
                    lobby?.max_players != null ? String(lobby.max_players) : "…"
                  }
                  onIncrement={
                    isRoomLeader ? () => onSetMaxPlayers(1) : undefined
                  }
                  onDecrement={
                    isRoomLeader ? () => onSetMaxPlayers(-1) : undefined
                  }
                />
                <ParamCell
                  label="ROUND (SEC)"
                  value={
                    lobby?.round_duration_seconds != null
                      ? String(lobby.round_duration_seconds)
                      : "…"
                  }
                  onIncrement={
                    isRoomLeader ? () => onSetRoundDuration(10) : undefined
                  }
                  onDecrement={
                    isRoomLeader ? () => onSetRoundDuration(-10) : undefined
                  }
                />
                <div className="border border-white/6 bg-[#0c0c0c] p-4">
                  <span
                    className={cn(
                      "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em]",
                      shell.muted,
                    )}
                  >
                    LOBBY
                  </span>
                  <span className="font-mono text-sm font-semibold tracking-wide text-white">
                    {lobby?.status ?? "…"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-8">
            <div
              className={cn("flex flex-1 flex-col overflow-hidden", shell.card)}
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/6 bg-[#0f0f0f]/80 px-5 py-4 md:px-6">
                <h2
                  className={cn(
                    "flex items-center gap-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.3em]",
                    shell.accent,
                  )}
                >
                  <IconUser className="size-5 shrink-0" stroke={1.5} />
                  GRID
                </h2>
                <span
                  className={cn(
                    "shrink-0 rounded border border-[#ff8c00]/25 bg-black/40 px-2.5 py-1",
                    "font-mono text-[11px] font-semibold tracking-wide text-[#ff8c00]",
                  )}
                >
                  {lobby ? `${count}/${maxP} CONNECTED` : "LOADING…"}
                </span>
              </div>

              <div className="flex flex-col gap-3 p-5 md:gap-3.5 md:p-6">
                {!lobby && (
                  <p className={cn("text-sm", shell.muted)}>Loading lobby…</p>
                )}
                {lobby &&
                  lobby.players.map((p, i) => {
                    const pid = p.player_id;
                    const isYou = playerId != null && pid === playerId;
                    const isLead = leaderId != null && pid === leaderId;
                    const base = rosterNames[i]?.base ?? "Player";
                    const key = base.toLowerCase();
                    const needsSuffix = (nameCounts.get(key) ?? 0) > 1;
                    const disambiguated = needsSuffix
                      ? `${base} · ${shortPlayerId(pid, 4)}`
                      : base;
                    const name = isYou
                      ? `${disambiguated} (you)`
                      : disambiguated;
                    const canKick = isRoomLeader && !isYou;
                    return (
                      <PlayerRow
                        key={`${pid}-${i}`}
                        slot={`P${i + 1}`}
                        name={name}
                        highlight={isYou}
                        isRoomLeader={isLead}
                        isReady={p.is_ready ?? false}
                        canKick={canKick}
                        kickBusy={kickBusyPlayerId === pid}
                        onKick={canKick ? () => onKickPlayer(pid) : undefined}
                      />
                    );
                  })}

                {lobby && count < maxP && (
                  <div
                    className={cn(
                      "flex min-h-18 items-center justify-center border border-dashed border-white/8 bg-black/20",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]",
                        shell.muted,
                      )}
                    >
                      <IconPlus className="size-4 opacity-70" stroke={1.5} />
                      WAITING FOR DRIVER
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isRoomLeader ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onToggleLock}
                  disabled={lockBusy || !playerId}
                  className={cn(
                    "group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-sm transition-all duration-300",
                    lobby?.locked
                      ? "border border-[#ff8c00]/60 bg-[#ff8c00]/10 text-[#ffb692]"
                      : "border border-white/10 bg-white/5 text-[#e8e6e4]",
                    "hover:bg-white/10",
                    "active:scale-[0.99]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8c00]",
                    "disabled:opacity-50",
                  )}
                >
                  {lobby?.locked ? (
                    <IconLock className="size-4" />
                  ) : (
                    <IconLockOpen className="size-4" />
                  )}
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    {lockBusy
                      ? "UPDATING…"
                      : lobby?.locked
                        ? "PRIVATE (LOCKED)"
                        : "PUBLIC (UNLOCKED)"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onStart}
                  disabled={startBusy || !playerId || !allNonLeadersReady}
                  className={cn(
                    "group relative flex h-18 w-full items-center justify-center gap-3 overflow-hidden rounded-sm transition-all duration-300 md:h-20 md:gap-4",
                    "bg-linear-to-r from-[#ff7700] via-[#ff9f4a] to-[#ffc49a]",
                    "text-[#3d1800]",
                    "shadow-[0_0_0_1px_rgba(255,200,150,0.25)_inset,0_8px_40px_rgba(255,120,0,0.35),0_0_60px_rgba(255,140,0,0.2)]",
                    "hover:shadow-[0_0_0_1px_rgba(255,220,190,0.35)_inset,0_12px_48px_rgba(255,120,0,0.45),0_0_80px_rgba(255,160,80,0.25)]",
                    "active:scale-[0.99]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8c00]",
                    "disabled:opacity-50",
                  )}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                  />
                  <IconPlayerPlayFilled className="relative size-8 shrink-0 md:size-9" />
                  <span className="relative font-sans text-xl font-black uppercase tracking-[0.18em] md:text-2xl">
                    {startBusy ? "STARTING…" : "INITIATE LAUNCH"}
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggleReady}
                disabled={readyBusy || !playerId}
                className={cn(
                  "group relative flex h-18 w-full items-center justify-center gap-3 overflow-hidden rounded-sm transition-all duration-300 md:h-20 md:gap-4",
                  isMeReady
                    ? "bg-linear-to-r from-[#ff7700] via-[#ff9f4a] to-[#ffc49a] text-[#3d1800]"
                    : "border border-white/10 bg-[#252525] text-[#e8e6e4]",
                  "active:scale-[0.99]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8c00]",
                  "disabled:opacity-50",
                )}
              >
                {isMeReady ? (
                  <IconCheck className="relative size-8 shrink-0 md:size-9" />
                ) : (
                  <IconClock className="relative size-8 shrink-0 md:size-9" />
                )}
                <span className="relative font-sans text-xl font-black uppercase tracking-[0.18em] md:text-2xl">
                  {readyBusy ? "UPDATING…" : isMeReady ? "READY" : "MARK READY"}
                </span>
              </button>
            )}
            {!playerId && (
              <p className="text-center text-xs text-[#c45c4a]/90">
                Waiting for player id from the server. Check realtime connection
                and Retry on the home screen.
              </p>
            )}
            {playerId && lobby && isRoomLeader && !allNonLeadersReady && (
              <p className="text-center text-xs text-[#888888]">
                Waiting for all non-leader players to mark ready.
              </p>
            )}
            {playerId && lobby && !isRoomLeader && (
              <p className="text-center text-xs text-[#888888]">
                Mark ready when you are set. Host can launch once everyone is
                ready.
              </p>
            )}
          </div>
        </div>
      </main>

      <nav
        className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-stretch justify-center gap-2 border-t border-white/6 bg-[#0a0a0a]/95 text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_-8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md md:hidden"
        aria-label="Mobile navigation"
      >
        <a
          className="flex flex-1 flex-col items-center justify-center border-t-2 border-[#ff8c00] bg-[#ff8c00]/8 px-4 text-[#ff8c00]"
          href="/lobby"
        >
          <IconLayoutGrid className="mb-1 size-6" stroke={1.5} />
          LOBBY
        </a>
        <a
          className="flex flex-1 flex-col items-center justify-center px-4 text-[#5c5c5c] transition-colors hover:bg-white/4 hover:text-[#ff8c00]/80"
          href="#"
        >
          <IconUsersGroup className="mb-1 size-6" stroke={1.5} />
          SOCIAL
        </a>
        <a
          className="flex flex-1 flex-col items-center justify-center px-4 text-[#5c5c5c] transition-colors hover:bg-white/4 hover:text-[#ff8c00]/80"
          href="#"
        >
          <IconFlame className="mb-1 size-6" stroke={1.5} />
          SHOP
        </a>
      </nav>
    </LobbyShell>
  );
}

function LobbyLoading() {
  return (
    <LobbyShell
      headerExtra="…"
      connLine="…"
      onLeave={() => {}}
      leaveDisabled
    >
      <main className="flex flex-1 items-center justify-center p-8 text-[#888]">
        Loading…
      </main>
    </LobbyShell>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={<LobbyLoading />}>
      <LobbyClient />
    </Suspense>
  );
}

function ParamCell({
  label,
  value,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: string;
  onIncrement?: () => void;
  onDecrement?: () => void;
}) {
  return (
    <div className="group relative border border-white/6 bg-[#0c0c0c] p-4">
      <span
        className={cn(
          "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em]",
          "text-[#888888]",
        )}
      >
        {label}
      </span>
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-medium tracking-wide text-white">
          {value}
        </span>
        {onIncrement && onDecrement && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={onDecrement}
              className="flex size-6 items-center justify-center rounded border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <IconMinus className="size-3" stroke={3} />
            </button>
            <button
              type="button"
              onClick={onIncrement}
              className="flex size-6 items-center justify-center rounded border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <IconPlus className="size-3" stroke={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerRow({
  slot,
  name,
  highlight,
  isRoomLeader,
  isReady,
  canKick,
  onKick,
  kickBusy,
}: {
  slot: string;
  name: string;
  highlight?: boolean;
  isRoomLeader?: boolean;
  isReady: boolean;
  canKick?: boolean;
  onKick?: () => void;
  kickBusy?: boolean;
}) {
  const subtitle = isRoomLeader
    ? highlight
      ? "YOU · ROOM LEAD"
      : "ROOM LEAD"
    : highlight
      ? "YOU"
      : "PEER";
  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-3 overflow-hidden border py-3 pl-4 pr-3 transition-colors md:py-4",
        highlight
          ? "border-[#ff8c00]/20 bg-[#1a1a1a]"
          : "border-white/6 bg-[#1a1a1a] hover:border-white/10",
      )}
    >
      {highlight ? (
        <div
          aria-hidden
          className="absolute bottom-0 left-0 top-0 w-1 bg-linear-to-b from-[#ff8c00] via-[#ffb366] to-[#ff8c00] shadow-[0_0_12px_rgba(255,140,0,0.5)]"
        />
      ) : null}
      <div className="relative z-10 flex min-w-0 items-center gap-3 md:gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center border border-white/8 bg-black/50 font-mono text-lg font-bold",
            highlight ? shell.accent : "text-[#a8a6a4]",
          )}
        >
          {slot}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold uppercase leading-tight tracking-tight text-white md:text-lg">
            {name}
          </h3>
          <span
            className={cn("font-mono text-[11px] tracking-wide", shell.muted)}
          >
            {subtitle}
          </span>
        </div>
      </div>
      <div className="z-10 flex shrink-0 items-center gap-2">
        {canKick ? (
          <button
            type="button"
            onClick={onKick}
            disabled={kickBusy}
            className={cn(
              "rounded-sm border border-[#c45c4a]/60 bg-[#2a1111]/80 px-3 py-2",
              "text-[10px] font-bold tracking-[0.2em] text-[#f0c0b8] uppercase",
              "transition-colors hover:bg-[#3a1515]",
              "disabled:opacity-60",
            )}
          >
            {kickBusy ? "KICKING" : "KICK"}
          </button>
        ) : null}
        {isReady ? (
          <div
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 md:px-4",
              "bg-linear-to-br from-[#ff8c00] to-[#ff6a00] text-[#2a1200]",
              "shadow-[0_0_20px_rgba(255,140,0,0.35)]",
            )}
          >
            <IconCheck className="size-4 shrink-0" stroke={2.5} aria-hidden />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
              READY
            </span>
          </div>
        ) : (
          <div
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-sm border border-white/8 bg-[#252525] px-3 py-2 md:px-4",
            )}
          >
            <IconClock className="size-4 text-[#888888]" stroke={1.5} />
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase">
              WAITING
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
