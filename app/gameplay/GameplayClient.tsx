"use client";

import { IconBell, IconBolt, IconHome, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useGameplaySession } from "@/lib/gameplay/useGameplaySession";
import { usePlayerConnection } from "@/lib/realtime/playerConnection";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function trapsBrowserShortcut(event: {
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  key: string;
}): boolean {
  return (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    /^f\d{1,2}$/i.test(event.key)
  );
}

export function GameplayClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room")?.trim() ?? "";
  const { status, playerId, lastError, reconnect } = usePlayerConnection();

  const navigatedRef = useRef(false);

  const onRoundFinished = useCallback(
    (ctx: { roomId: string; playerId: string | null }) => {
      if (navigatedRef.current) {
        return;
      }
      navigatedRef.current = true;
      const q = new URLSearchParams();
      q.set("room", ctx.roomId);
      if (ctx.playerId) {
        q.set("player", ctx.playerId);
      }
      router.replace(`/results?${q.toString()}`);
    },
    [router],
  );

  const session = useGameplaySession({
    roomId,
    playerId,
    onRoundFinished,
  });

  const [entry, setEntry] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const resetFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigatedRef.current = false;
  }, [roomId]);

  const objectiveText = useMemo(() => {
    if (!session.currentChallenge) {
      return "—";
    }
    return session.currentChallenge.prompt;
  }, [session.currentChallenge]);

  const outcomeLabel = useMemo(() => {
    if (session.myProgress === null) {
      return "Waiting for your slot…";
    }
    if (session.gameState?.finished) {
      if (session.gameState.winner_player_id) {
        return "Race finished";
      }
      return "Time up";
    }
    return "Match in progress";
  }, [session.gameState, session.myProgress]);

  useEffect(() => {
    if (!session.gameState?.finished) {
      inputRef.current?.focus();
    }
  }, [session.gameState?.finished, objectiveText, roomId]);

  useEffect(() => {
    return () => {
      if (resetFeedbackTimer.current) {
        clearTimeout(resetFeedbackTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!playerId || !session.gameState || session.gameState.finished) {
      return;
    }
    const onWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!trapsBrowserShortcut(event)) {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onWindowKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onWindowKeyDown, true);
    };
  }, [playerId, session.gameState, session.gameState?.finished]);

  function setTransientFeedback(nextFeedback: "success" | "error") {
    setFeedback(nextFeedback);
    if (resetFeedbackTimer.current) {
      clearTimeout(resetFeedbackTimer.current);
    }
    resetFeedbackTimer.current = setTimeout(() => {
      setFeedback("idle");
    }, 240);
  }

  async function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (session.gameState?.finished) {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!entry.trim()) {
        return;
      }
      const r = await session.trySubmitText(entry);
      setEntry("");
      if (r.ok && !r.message) {
        setTransientFeedback("success");
      } else {
        setTransientFeedback("error");
      }
      return;
    }
    if (trapsBrowserShortcut(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
    const r = await session.trySubmitKeys(event);
    if (r) {
      if (r.ok && !r.message) {
        setTransientFeedback("success");
      } else if (r.message) {
        setTransientFeedback("error");
      }
    }
  }

  const lanes = useMemo(() => {
    const ids = session.roomView?.players ?? [];
    if (ids.length === 0) {
      return [] as { id: string; you: boolean; pct: number; label: string }[];
    }
    const gs = session.gameState;
    return ids.map((pid, i) => {
      const p = gs?.players[pid];
      const pct = p ? p.progress_percent : 0;
      return {
        id: pid,
        you: playerId === pid,
        pct: clamp(pct, 0, 100),
        label: playerId === pid ? "YOU" : `P${i + 1}`,
      };
    });
  }, [playerId, session.gameState, session.roomView?.players]);

  const wpm = session.myProgress
    ? Math.round(session.myProgress.wpm)
    : 0;
  const acc = session.myProgress
    ? session.myProgress.accuracy
    : 0;
  const streak = session.myProgress ? session.myProgress.streak : 0;

  const inputVisualClass =
    feedback === "success"
      ? "bg-[#2a2a2a] shadow-[inset_0_0_0_1px_#ffb950,inset_2px_0_0_0_#ffb692]"
      : feedback === "error"
        ? "bg-[#20110a] shadow-[inset_0_0_0_1px_#ff6d00,inset_2px_0_0_0_#ff6d00]"
        : "bg-[#0e0e0e]";

  const overlayColorClass =
    feedback === "error" ? "bg-[#93000a]" : "bg-[#ff6d00]";

  const finished = Boolean(session.gameState?.finished);
  const syncLabel =
    session.syncMode === "reconnecting"
      ? "Live updates: reconnecting — using poll fallback."
      : session.syncMode === "polling"
        ? "Live updates: polling (websocket offline)."
        : "Live updates: websocket + poll backup.";

  if (!roomId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[#0e0e0e] px-4 text-center text-[#e5e2e1]">
        <p className="mb-2 max-w-md text-balance text-[#a98a7c]">
          No <span className="font-mono text-[#ff6d00]">room</span> in the
          address. Start a match from a lobby, or return home.
        </p>
        <Link
          className="mt-4 inline-flex items-center gap-2 text-sm text-[#ff6d00] underline"
          href="/"
        >
          <IconHome className="size-4" aria-hidden />
          Home
        </Link>
      </div>
    );
  }

  if (session.loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0e0e0e] text-[#ffb692]">
        Loading game room…
      </div>
    );
  }

  if (session.loadError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[#0e0e0e] px-4 text-center">
        <p className="text-[#c45c4a]">{session.loadError}</p>
        <Link className="mt-4 text-sm text-[#ff6d00] underline" href="/">
          Home
        </Link>
      </div>
    );
  }

  if (!playerId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[#0e0e0e] px-4 text-center text-[#e5e2e1]">
        <p className="mb-2 text-[#a98a7c]">
          Waiting for player id from the server. {lastError ?? ""}
        </p>
        <button
          type="button"
          onClick={reconnect}
          className="text-sm text-[#ff6d00] underline"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-svh bg-[#0e0e0e] text-[#e5e2e1] selection:bg-[#ff6d00] selection:text-[#341100]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-home opacity-60"
      />

      <nav className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#201f1f] bg-[#131313]/95 px-4 shadow-[0_4px_20px_rgba(255,109,0,0.05)] backdrop-blur md:px-8">
        <div className="text-lg font-black tracking-tight text-[#ff6d00] uppercase italic md:text-xl">
          Shortcut Showdown
        </div>

        <p className="hidden max-w-sm truncate text-right text-[10px] text-[#a98a7c] md:block">
          {syncLabel} RT: {status}
        </p>

        <div className="flex items-center gap-3 text-[#ff6d00]">
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-sm p-1.5 transition-colors hover:text-[#ffb692]"
          >
            <IconBell className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Powerups"
            className="rounded-sm p-1.5 transition-colors hover:text-[#ffb692]"
          >
            <IconBolt className="size-5" />
          </button>
        </div>
      </nav>

      {session.syncMode === "reconnecting" && (
        <div className="flex flex-col items-center gap-1 border-b border-[#594136] bg-[#1c1b1b] px-4 py-2 text-center text-xs text-[#ffcf8f] sm:flex-row sm:justify-center sm:gap-3">
          <span>Reconnecting to realtime — match state refreshes on a timer.</span>
          <button
            type="button"
            onClick={session.onReconnectSync}
            className="rounded border border-[#ff6d00]/50 px-2 py-0.5 text-[#ff6d00]"
          >
            Request sync
          </button>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 md:px-8 md:py-8">
        <section className="flex w-full items-end justify-between gap-4 md:-ml-8">
          <div className="border-l-4 border-[#ffb692] bg-[#131313]/95 p-5 shadow-[0_0_30px_rgba(255,109,0,0.08)] md:p-6">
            <div className="text-xs tracking-[0.18em] text-[#ffb692] uppercase">
              Current WPM
            </div>
            <div className="text-5xl font-bold tracking-tighter text-[#e5e2e1] drop-shadow-[0_0_10px_rgba(255,109,0,0.45)] md:text-6xl">
              {wpm}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="bg-[#1c1b1b] px-3 py-2 text-right md:px-4 md:py-3">
              <div className="text-[10px] tracking-[0.16em] text-[#a98a7c] uppercase">
                Time Left
              </div>
              <div className="text-lg text-[#ffb692] md:text-xl">
                {formatTime(session.timeLeftSec)}
              </div>
            </div>
            <div className="bg-[#1c1b1b] px-3 py-2 text-right md:px-4 md:py-3">
              <div className="text-[10px] tracking-[0.16em] text-[#a98a7c] uppercase">
                Accuracy
              </div>
              <div className="text-lg text-[#e5e2e1] md:text-xl">
                {acc.toFixed(1)}%
              </div>
            </div>
            <div className="bg-linear-to-br from-[#1c1b1b] to-[#353534] px-3 py-2 text-right md:px-4 md:py-3">
              <div className="text-[10px] tracking-[0.16em] text-[#ffb692] uppercase">
                Streak
              </div>
              <div className="text-lg font-bold text-[#ffcf8f] md:text-xl">
                x{streak}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border border-[#353534] bg-[#2a2a2a]/60 p-6 shadow-[0_0_20px_rgba(255,109,0,0.15)] backdrop-blur md:p-16">
          <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-[#353534] via-[#ff6d00] to-[#353534] opacity-60" />

          <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 md:gap-8">
            <span className="border-l-2 border-[#ffb692] bg-[#0e0e0e] px-4 py-1 text-xs tracking-[0.28em] text-[#ffb692] uppercase">
              Active Objective
            </span>

            <div className="text-center text-2xl font-bold leading-tight tracking-tight sm:text-4xl md:text-6xl">
              <span className="text-[#e5e2e1] uppercase drop-shadow-[0_0_10px_rgba(255,109,0,0.55)]">
                {objectiveText}
              </span>
            </div>

            {session.submitError && (
              <p className="text-center text-sm text-[#c45c4a]">
                {session.submitError}
              </p>
            )}

            <div className="relative mt-1 w-full max-w-2xl">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-lg text-[#ffb692]">
                &gt;
              </span>
              <input
                ref={inputRef}
                aria-label="Type the shortcut"
                autoComplete="off"
                className={`w-full border-none py-4 pr-4 pl-12 text-xl tracking-[0.12em] text-[#e5e2e1] outline-none transition-all md:text-2xl ${inputVisualClass}`}
                disabled={finished}
                placeholder={
                  finished
                    ? "Round complete"
                    : "Ctrl/Cmd + key, or type shortcut + Enter"
                }
                spellCheck={false}
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                onKeyDown={(e) => {
                  void handleInputKeyDown(e);
                }}
              />
              <div
                className={`pointer-events-none absolute inset-0 animate-pulse mix-blend-screen opacity-10 ${overlayColorClass}`}
              />
            </div>

            <p className="text-xs tracking-[0.2em] text-[#a98a7c] uppercase md:text-sm">
              {outcomeLabel}
            </p>
          </div>
        </section>

        <section className="mt-1 flex w-full flex-col gap-3 md:mt-4">
          <h2 className="mb-2 text-sm tracking-[0.16em] text-[#a98a7c] uppercase">
            Live Telemetry
          </h2>

          {lanes.length === 0 && (
            <p className="text-sm text-[#a98a7c]">No players in snapshot.</p>
          )}

          {lanes.map((lane) => (
            <div
              key={lane.id}
              className="relative h-16 bg-[#1c1b1b] odd:bg-[#131313]"
            >
              <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#594136] opacity-30" />
              <div
                className="absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 transition-[left] duration-500 ease-out"
                style={{ left: `${lane.pct.toFixed(1)}%` }}
              >
                {lane.you && (
                  <span className="text-xs font-bold text-[#ffb692]">
                    {lane.label}
                  </span>
                )}
                <div
                  className={`flex size-10 items-center justify-center border-l-2 border-[#ffcf8f] bg-[#2a2a2a] shadow-[0_0_15px_rgba(255,109,0,0.2)] ${
                    lane.you ? "" : "opacity-70"
                  }`}
                >
                  <IconUser
                    className={
                      lane.you ? "size-5 text-[#ffcf8f]" : "size-5 text-[#a98a7c]"
                    }
                  />
                </div>
                {!lane.you && (
                  <span className="text-xs font-bold text-[#a98a7c]">
                    {lane.label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
