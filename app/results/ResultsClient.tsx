"use client";

import {
  IconGauge,
  IconHome,
  IconUsersPlus,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiError,
  acceptRematch,
  declineRematch,
  createRematch,
  type MatchResultsView,
} from "@/lib/api";
import { formatApiErrorForUi } from "@/lib/api/errors";
import {
  usePlayerConnection,
  type PlayerConnectionStatus,
} from "@/lib/realtime/playerConnection";
import { useProtectedRoute } from "@/lib/session/useProtectedRoute";
import { fetchMatchResultsWithRetry } from "@/lib/results/fetchMatchResultsWithRetry";
import {
  findPlacementForPlayer,
  podiumRowsInVisualOrder,
  resultsOutcomeHeadline,
  resultsOutcomeSubcopy,
} from "@/lib/results/podiumFromPlacements";
import {
  clearPersistedResultsContext,
  loadPersistedResultsContext,
  persistResultsRouteContext,
} from "@/lib/session/resultsContext";

const accuracyRadius = 36;
const accuracyCircumference = 2 * Math.PI * accuracyRadius;

function rematchMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.message === "rematch_roster_changed") {
      return "A player left the match. Start a new lobby with whoever is still here.";
    }
    if (err.message === "match_not_finished") {
      return "The match is not finished yet.";
    }
    if (err.message === "player_not_in_match") {
      return "You are not in this match. Reconnect and try again.";
    }
    return formatApiErrorForUi(err);
  }
  if (err instanceof Error) return err.message;
  return "Rematch could not be created.";
}

export function ResultsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomId, setRoomId] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState(false);

  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResultsView | null>(null);

  const [rematchState, setRematchState] = useState<
    "idle" | "accepting" | "declined" | "error"
  >("idle");
  const [rematchError, setRematchError] = useState<string | null>(null);
  const [rematchAcceptances, setRematchAcceptances] = useState<{
    [playerId: string]: boolean;
  }>({});
  const [pendingPlayers, setPendingPlayers] = useState<string[]>([]);

  let status: PlayerConnectionStatus = "disconnected";
  let wsPlayerId: string | null = null;
  let sendWebSocketJson: (body: Record<string, unknown>) => boolean = () =>
    false;
  let conn: {
    status: PlayerConnectionStatus;
    playerId: string | null;
    subscribeMessages?: (cb: (d: unknown) => void) => () => void;
    sendWebSocketJson: (body: Record<string, unknown>) => boolean;
  } | null = null;
  try {
    const c = usePlayerConnection();
    conn = c;
    status = c.status;
    wsPlayerId = c.playerId;
    sendWebSocketJson = c.sendWebSocketJson;
  } catch {
    // If the provider is not present (e.g., in unit tests), fall back to no-op
  }

  const sendWebSocketJsonRef = useRef<(body: Record<string, unknown>) => boolean>(() => false);
  sendWebSocketJsonRef.current = sendWebSocketJson;

  useEffect(() => {
    if (status === "connected" && roomId && wsPlayerId) {
      sendWebSocketJsonRef.current({
        type: "join_room",
        payload: { room_id: roomId, player_id: wsPlayerId },
      });
    }
  }, [status, roomId, wsPlayerId]);

  const subscribeMessages = conn?.subscribeMessages;
  useEffect(() => {
    if (!subscribeMessages) return;
    const unsub = subscribeMessages((data: unknown) => {
      if (typeof data === "object" && data !== null && "type" in data) {
        const typed = data as { type: string; payload?: unknown };
        if (typed.type === "rematch_ready") {
          const payload = typed.payload as
            | { next_lobby_id?: string }
            | undefined;
          const next_lobby_id = payload?.next_lobby_id;
          if (next_lobby_id) router.push(`/lobby?id=${next_lobby_id}`);
        } else if (typed.type === "rematch_acceptance_update") {
          const payload = typed.payload as
            | {
                acceptances?: Record<string, boolean>;
                pending_players?: string[];
              }
            | undefined;
          const acceptances = payload?.acceptances ?? {};
          const pending_players = payload?.pending_players ?? [];
          setRematchAcceptances(acceptances);
          setPendingPlayers(pending_players);
        } else if (typed.type === "rematch_declined") {
          const payload = typed.payload as { player_id?: string } | undefined;
          const player_id = payload?.player_id;
          if (player_id)
            setRematchAcceptances((prev) => ({ ...prev, [player_id]: false }));
        }
      }
    });
    return unsub;
  }, [subscribeMessages, router]);

  useProtectedRoute();

  useEffect(() => {
    void Promise.resolve().then(() => {
      const spRoom = searchParams.get("room")?.trim() ?? "";
      const spPlayer = searchParams.get("player")?.trim() ?? "";
      const persisted = loadPersistedResultsContext();
      const r = spRoom || persisted?.roomId || "";
      const p = (spPlayer || persisted?.playerId || "").trim() || null;
      setRoomId(r);
      setPlayerId(p);
      setResolvedParams(true);
      if (r && !spRoom && persisted?.roomId) {
        const q = new URLSearchParams();
        q.set("room", r);
        if (p) q.set("player", p);
        router.replace(`/results?${q.toString()}`);
      }
    });
  }, [router, searchParams]);

  useEffect(() => {
    if (resolvedParams && !roomId) {
      router.replace("/");
    }
  }, [resolvedParams, roomId, router]);

  const runFetch = useCallback(async () => {
    if (!roomId) return;
    setLoadState("loading");
    setLoadError(null);
    try {
      const data = await fetchMatchResultsWithRetry(roomId, playerId);
      setResults(data);
      setLoadState("ok");
      persistResultsRouteContext(data.room_id, playerId);
    } catch (e) {
      setLoadState("error");
      setLoadError(formatApiErrorForUi(e));
    }
  }, [roomId, playerId]);

  useEffect(() => {
    if (!resolvedParams || !roomId) return;
    void (async () => {
      await Promise.resolve();
      await runFetch();
    })();
  }, [resolvedParams, roomId, runFetch]);

  const you = useMemo(
    () =>
      results
        ? findPlacementForPlayer(
            results.placements,
            results.you_player_id ?? playerId,
          )
        : null,
    [results, playerId],
  );

  const podium = useMemo(() => {
    if (!results) return [];
    const youId = results.you_player_id ?? playerId;
    return podiumRowsInVisualOrder(results.placements, youId);
  }, [results, playerId]);

  const accuracy = you ? Math.round(you.accuracy) : 0;
  const accuracyOffset = accuracyCircumference * (1 - accuracy / 100);

  const headline = results ? resultsOutcomeHeadline(results) : "RACE COMPLETE";
  const subcopy = results ? resultsOutcomeSubcopy(results) : "Loading…";

  async function onAcceptRematch() {
    if (!roomId || !playerId) {
      setRematchState("error");
      setRematchError(
        "Missing player id. Reopen results from the game client.",
      );
      return;
    }
    setRematchState("accepting");
    setRematchError(null);
    try {
      const res = await acceptRematch(roomId, { player_id: playerId });
      setRematchAcceptances((prev) => ({ ...prev, [playerId]: true }));
      setPendingPlayers(res.pending_players);

      if (res.all_accepted) {
        // All players accepted, navigate to rematch lobby
        // Note: rematch_ready event from WebSocket will redirect us
        setRematchState("idle");
      } else {
        setRematchState("idle");
      }
    } catch (e) {
      setRematchState("error");
      setRematchError(rematchMessage(e));
    }
  }

  async function onDeclineRematch() {
    if (!roomId || !playerId) {
      setRematchState("error");
      setRematchError(
        "Missing player id. Reopen results from the game client.",
      );
      return;
    }
    setRematchState("declined");
    setRematchError(null);
    try {
      const res = await declineRematch(roomId, { player_id: playerId });
      setRematchAcceptances((prev) => ({ ...prev, [playerId]: false }));
      setPendingPlayers(res.pending_players);
    } catch (e) {
      setRematchState("error");
      setRematchError(rematchMessage(e));
    }
  }

  async function onCreateRematch() {
    if (!roomId || !playerId) {
      setRematchState("error");
      setRematchError(
        "Missing player id. Reopen results from the game client.",
      );
      return;
    }
    setRematchState("accepting");
    setRematchError(null);
    try {
      const res = await createRematch(roomId, { player_id: playerId });
      if (res.next_lobby_id) {
        router.push(`/lobby?id=${res.next_lobby_id}`);
        return;
      }
      setRematchState("idle");
    } catch (e) {
      setRematchState("error");
      setRematchError(rematchMessage(e));
    }
  }

  function onNewLobby() {
    clearPersistedResultsContext();
    router.push("/");
  }

  const showLoading =
    !resolvedParams ||
    (!!roomId &&
      (loadState === "idle" || loadState === "loading") &&
      loadError === null);

  if (showLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#090909] text-[#ffb692]">
        Loading results…
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[#090909] px-4 text-center text-[#e5e2e1]">
        <p className="max-w-md text-[#c45c4a]">
          No match in this session. Open results from a finished game or return
          home.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-sm border border-[#252525] bg-[#141417] px-4 py-2 text-sm text-[#ece9e7]"
        >
          Home
        </Link>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[#090909] px-4 text-center text-[#e5e2e1]">
        <p className="max-w-md text-[#c45c4a]">{loadError}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void runFetch()}
            className="rounded-sm border border-[#ff6d00]/60 px-4 py-2 text-sm font-bold text-[#ffb692]"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-sm border border-[#252525] bg-[#141417] px-4 py-2 text-sm text-[#ece9e7]"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#090909] text-[#e5e2e1] selection:bg-[#ff6d00] selection:text-[#341100]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-home opacity-35"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,109,0,0.18)_0%,rgba(0,0,0,0)_68%)]"
      />

      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute left-[24%] top-[11%] h-1 w-8 rotate-45 bg-[#ffb692]/75 shadow-[0_0_12px_rgba(255,140,0,0.55)]" />
        <span className="absolute left-[68%] top-[27%] size-2 rotate-45 bg-[#ffcf8f]/80 shadow-[0_0_12px_rgba(255,171,0,0.6)]" />
        <span className="absolute bottom-[12%] left-[66%] h-1 w-10 rotate-78 bg-[#ffb692]/70 shadow-[0_0_14px_rgba(255,140,0,0.5)]" />
      </div>

      <main className="relative z-10 mx-auto grid min-h-svh w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 md:px-8 md:py-10 lg:grid-cols-12 lg:items-center lg:gap-10">
        <section className="lg:col-span-7">
          <header className="mb-8 text-center lg:text-left">
            <h1 className="text-4xl font-black tracking-tight text-[#ff7d1f] drop-shadow-[0_0_16px_rgba(255,109,0,0.45)] sm:text-5xl md:text-7xl">
              {headline}
            </h1>
            <p className="mt-2 text-xs font-medium tracking-[0.25em] text-[#ffb692] uppercase md:text-sm">
              {subcopy}
            </p>
          </header>

          <div className="mx-auto flex max-w-xl items-end justify-center gap-3 sm:gap-5 lg:mx-0">
            {podium.length === 0 && (
              <p className="text-sm text-[#a98a7c]">No podium data.</p>
            )}
            {podium.map((entry) => {
              const isFirst = entry.place === 1;
              const heightClass =
                entry.place === 1
                  ? "h-40 sm:h-44"
                  : entry.place === 2
                    ? "h-28 sm:h-32"
                    : "h-24 sm:h-26";

              return (
                <article
                  key={`${entry.place}-${entry.name}`}
                  className={`relative flex w-24 flex-col items-center sm:w-28 ${
                    isFirst ? "-translate-y-8" : ""
                  }`}
                >
                  {isFirst ? (
                    <span className="mb-3 rounded-sm bg-[#ff6d00]/20 px-3 py-1 text-[11px] font-black tracking-wide text-[#ffb692] shadow-[0_0_14px_rgba(255,109,0,0.3)]">
                      {results?.draw ? "TIED" : "VICTOR"}
                    </span>
                  ) : null}

                  <div
                    className={`mb-3 flex size-14 items-center justify-center border border-[#ff6d00]/80 text-sm font-black text-[#7dd3ff] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] sm:size-16 ${
                      entry.highlighted
                        ? "bg-linear-to-b from-[#123041] to-[#08121a] shadow-[0_0_20px_rgba(255,109,0,0.35)]"
                        : "bg-linear-to-b from-[#162531] to-[#0a1015]"
                    }`}
                  >
                    {entry.initials}
                  </div>

                  <div className="mb-2 text-center">
                    <p
                      className={`text-sm font-extrabold tracking-tight ${
                        isFirst ? "text-[#ffb692]" : "text-[#d5d2d0]"
                      }`}
                    >
                      {entry.name}
                    </p>
                    <p className="text-xs font-semibold text-[#ffb692]">
                      {entry.wpm} WPM
                    </p>
                  </div>

                  <div
                    className={`relative ${heightClass} w-full border border-[#2b2b2b] bg-[#131313] ${
                      isFirst
                        ? "border-[#6f5341] bg-linear-to-b from-[#45403b] to-[#2f2f2f] shadow-[inset_0_-3px_0_#ffb692]"
                        : "bg-[#121215]"
                    }`}
                  >
                    {isFirst ? (
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-[#ff6d00]/12 to-transparent" />
                    ) : null}
                    <span
                      className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-4xl font-black ${
                        isFirst ? "text-[#ffb692]" : "text-[#343437]"
                      }`}
                    >
                      {entry.place}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5">
          <div className="border border-[#2b2b2b] bg-[#1b1b1c]/75 p-5 shadow-[0_0_28px_rgba(255,109,0,0.12)] backdrop-blur-md md:p-6">
            <div className="mb-4 flex items-center gap-2 text-[#ece9e7]">
              <IconGauge className="size-5 text-[#ffb692]" />
              <h2 className="text-lg font-bold uppercase">Session Telemetry</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 border border-[#2a2a2a] bg-[#090909] p-4">
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-[#a8a2a0] uppercase">
                    Accuracy
                  </p>
                  <p className="text-sm text-[#d0cdcb]">Your final average</p>
                </div>

                <div className="relative size-20 shrink-0">
                  <svg
                    className="size-full -rotate-90"
                    viewBox="0 0 100 100"
                    aria-hidden
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r={accuracyRadius}
                      fill="none"
                      stroke="rgba(56,56,56,1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={accuracyRadius}
                      fill="none"
                      stroke="#ff7b12"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={accuracyCircumference}
                      strokeDashoffset={accuracyOffset}
                      className="drop-shadow-[0_0_7px_rgba(255,109,0,0.8)]"
                    />
                  </svg>
                  <span className="absolute inset-0 grid place-items-center text-2xl font-black text-[#ffb692]">
                    {you ? `${accuracy}%` : "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#2a2a2a] bg-[#090909] p-4">
                  <p className="text-[11px] tracking-[0.2em] text-[#a8a2a0] uppercase">
                    Best streak
                  </p>
                  <p className="mt-2 text-4xl leading-none font-bold tracking-tight text-[#ece9e7]">
                    {you ? `×${you.streak}` : "—"}
                  </p>
                </div>

                <div className="border border-[#2a2a2a] bg-[#090909] p-4">
                  <p className="text-[11px] tracking-[0.2em] text-[#a8a2a0] uppercase">
                    Attempts
                  </p>
                  <div className="mt-2 flex items-end gap-4">
                    <div>
                      <p className="text-xs text-[#d0cdcb]">Correct</p>
                      <p className="text-3xl leading-none font-bold text-[#ece9e7]">
                        {you?.attempts_correct ?? "—"}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-[#2f2f2f]" />
                    <div>
                      <p className="text-xs text-[#ff9d90]">Total</p>
                      <p className="text-3xl leading-none font-bold text-[#d44f43]">
                        {you?.attempts_total ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <div className="mb-1 flex items-end justify-between">
                  <p className="text-[11px] tracking-[0.2em] text-[#a8a2a0] uppercase">
                    Progress
                  </p>
                  <p className="text-sm font-bold text-[#ffd08d]">
                    {you
                      ? `${Math.round(you.progress_percent)}% objectives`
                      : "—"}
                  </p>
                </div>
                <div className="h-3 overflow-hidden border border-[#2a2a2a] bg-[#090909]">
                  <div
                    className="h-full bg-linear-to-r from-[#ffb467] to-[#f9cb8a] shadow-[0_0_14px_rgba(255,183,108,0.5)]"
                    style={{
                      width: you
                        ? `${Math.min(100, Math.max(0, you.progress_percent))}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {rematchState === "error" && rematchError ? (
              <p className="text-center text-sm text-[#ff9d90]" role="alert">
                {rematchError}
              </p>
            ) : null}

            {rematchAcceptances[playerId || ""] === undefined ? (
              <>
                <p className="text-center text-sm text-[#ffb692]">
                  Ready for a rematch?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={rematchState === "accepting"}
                    onClick={() => void onAcceptRematch()}
                    className="flex items-center justify-center gap-2 rounded-sm border border-[#4caf50]/60 bg-[#1b5e20]/20 px-4 py-3 text-sm font-bold tracking-[0.12em] text-[#81c784] uppercase transition hover:bg-[#1b5e20]/30 disabled:opacity-50"
                  >
                    <IconCheck className="size-4" />
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={rematchState === "accepting"}
                    onClick={() => void onDeclineRematch()}
                    className="flex items-center justify-center gap-2 rounded-sm border border-[#f44336]/60 bg-[#b71c1c]/20 px-4 py-3 text-sm font-bold tracking-[0.12em] text-[#ef5350] uppercase transition hover:bg-[#b71c1c]/30 disabled:opacity-50"
                  >
                    <IconX className="size-4" />
                    Decline
                  </button>
                </div>
              </>
            ) : rematchAcceptances[playerId || ""] ? (
              <>
                <p className="text-center text-sm text-[#81c784]">
                  ✓ You accepted rematch
                </p>
                {pendingPlayers.length > 0 ? (
                  <p className="text-center text-xs text-[#ffb692]">
                    Waiting for {pendingPlayers.length} player
                    {pendingPlayers.length !== 1 ? "s" : ""}…
                  </p>
                ) : (
                  <p className="text-center text-xs text-[#81c784]">
                    Finalizing roster…
                  </p>
                )}
              </>
            ) : (
              <p className="text-center text-sm text-[#ef5350]">
                You declined rematch
              </p>
            )}

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <button
                type="button"
                onClick={onNewLobby}
                className="flex items-center justify-center gap-2 rounded-sm border border-[#252525] bg-[#0d0d10] px-5 py-3 text-sm font-bold tracking-[0.12em] text-[#ece9e7] uppercase transition hover:bg-[#17171a]"
              >
                <IconUsersPlus className="size-4" />
                New Lobby
              </button>

              <Link
                href="/"
                aria-label="Back home"
                className="grid place-items-center rounded-sm border border-[#252525] bg-[#141417] px-4 text-[#ffb692] transition hover:bg-[#1d1d20]"
              >
                <IconHome className="size-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
