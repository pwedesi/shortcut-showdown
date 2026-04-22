"use client";

import { IconBell, IconBolt, IconUser } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

type Objective = {
  command: string;
  shortcut: string;
  key: string;
};

type RacePositions = {
  you: number;
  opp1: number;
  opp2: number;
};

type Winner = "YOU" | "OPP_1" | "OPP_2";

type GameState = {
  timeLeft: number;
  objectiveIndex: number;
  attempts: number;
  errors: number;
  streak: number;
  typedChars: number;
  wpm: number;
  accuracy: number;
  race: RacePositions;
  finished: boolean;
  winner: Winner | null;
};

const OBJECTIVES: Objective[] = [
  { command: "copy it", shortcut: "Ctrl + C", key: "c" },
  { command: "paste it", shortcut: "Ctrl + V", key: "v" },
  { command: "undo that", shortcut: "Ctrl + Z", key: "z" },
  { command: "save file", shortcut: "Ctrl + S", key: "s" },
  { command: "find text", shortcut: "Ctrl + F", key: "f" },
];

const ROUND_SECONDS = 42;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeInput(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "").replace("control", "ctrl");
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getWinner(race: RacePositions): Winner | null {
  if (race.you >= 100) return "YOU";
  if (race.opp1 >= 100) return "OPP_1";
  if (race.opp2 >= 100) return "OPP_2";
  return null;
}

export default function GameplayPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resetFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number>(0);

  const [entry, setEntry] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "success" | "error">("idle");
  const [game, setGame] = useState<GameState>({
    timeLeft: ROUND_SECONDS,
    objectiveIndex: 0,
    attempts: 0,
    errors: 0,
    streak: 24,
    typedChars: 0,
    wpm: 124,
    accuracy: 98.5,
    race: {
      you: 75,
      opp1: 60,
      opp2: 40,
    },
    finished: false,
    winner: null,
  });

  const objective = useMemo(
    () => OBJECTIVES[game.objectiveIndex % OBJECTIVES.length],
    [game.objectiveIndex],
  );

  useEffect(() => {
    inputRef.current?.focus();
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (game.finished) {
      return;
    }

    const timerId = setInterval(() => {
      setGame((previous: GameState) => {
        if (previous.finished) {
          return previous;
        }

        const nextTimeLeft = Math.max(0, previous.timeLeft - 1);
        const nextRace = {
          you: clamp(
            previous.race.you +
              0.6 +
              (previous.streak > 0 ? Math.min(previous.streak * 0.06, 1.6) : 0),
            0,
            100,
          ),
          opp1: clamp(previous.race.opp1 + 1.2 + Math.random() * 1.7, 0, 100),
          opp2: clamp(previous.race.opp2 + 0.8 + Math.random() * 1.4, 0, 100),
        };

        const winner = getWinner(nextRace);
        const elapsedMinutes = Math.max((Date.now() - startedAt.current) / 60000, 1 / 60);
        const calculatedWpm = (previous.typedChars / 5) / elapsedMinutes;
        const successRate =
          previous.attempts > 0
            ? ((previous.attempts - previous.errors) / previous.attempts) * 100
            : 98.5;

        return {
          ...previous,
          timeLeft: nextTimeLeft,
          race: nextRace,
          wpm: Math.round(clamp(calculatedWpm, 24, 220)),
          accuracy: clamp(successRate, 0, 100),
          finished: winner !== null || nextTimeLeft === 0,
          winner,
        };
      });
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [game.finished]);

  useEffect(() => {
    return () => {
      if (resetFeedbackTimer.current) {
        clearTimeout(resetFeedbackTimer.current);
      }
    };
  }, []);

  function setTransientFeedback(nextFeedback: "success" | "error") {
    setFeedback(nextFeedback);
    if (resetFeedbackTimer.current) {
      clearTimeout(resetFeedbackTimer.current);
    }
    resetFeedbackTimer.current = setTimeout(() => {
      setFeedback("idle");
    }, 240);
  }

  function applyAttempt(success: boolean, shortcutLength: number) {
    setGame((previous: GameState) => {
      if (previous.finished) {
        return previous;
      }

      const nextRace = {
        ...previous.race,
        you: clamp(previous.race.you + (success ? 3.8 + Math.random() * 1.9 : -0.8), 0, 100),
      };

      const nextAttempts = previous.attempts + 1;
      const nextErrors = previous.errors + (success ? 0 : 1);
      const nextTypedChars = previous.typedChars + (success ? shortcutLength + 1 : 0);
      const elapsedMinutes = Math.max((Date.now() - startedAt.current) / 60000, 1 / 60);
      const calculatedWpm = (nextTypedChars / 5) / elapsedMinutes;
      const successRate = ((nextAttempts - nextErrors) / nextAttempts) * 100;
      const winner = getWinner(nextRace);

      return {
        ...previous,
        race: nextRace,
        attempts: nextAttempts,
        errors: nextErrors,
        typedChars: nextTypedChars,
        objectiveIndex: success ? previous.objectiveIndex + 1 : previous.objectiveIndex,
        streak: success ? previous.streak + 1 : 0,
        wpm: Math.round(clamp(calculatedWpm, 24, 220)),
        accuracy: clamp(successRate, 0, 100),
        finished: winner !== null || previous.timeLeft === 0,
        winner,
      };
    });

    setEntry("");
    setTransientFeedback(success ? "success" : "error");
  }

  function handleShortcutAttempt(key: string, hasModifier: boolean) {
    if (game.finished) {
      return;
    }

    const success = hasModifier && key === objective.key;
    applyAttempt(success, objective.shortcut.length);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (game.finished) {
      return;
    }

    const key = event.key.toLowerCase();
    const hasModifier = event.ctrlKey || event.metaKey;

    if (hasModifier && key.length === 1) {
      event.preventDefault();
      handleShortcutAttempt(key, true);
      return;
    }

    if (event.key === "Enter") {
      const entered = normalizeInput(entry);
      const expected = normalizeInput(objective.shortcut);
      applyAttempt(entered === expected, objective.shortcut.length);
    }
  }

  const inputVisualClass =
    feedback === "success"
      ? "bg-[#2a2a2a] shadow-[inset_0_0_0_1px_#ffb950,inset_2px_0_0_0_#ffb692]"
      : feedback === "error"
        ? "bg-[#20110a] shadow-[inset_0_0_0_1px_#ff6d00,inset_2px_0_0_0_#ff6d00]"
        : "bg-[#0e0e0e]";

  const overlayColorClass = feedback === "error" ? "bg-[#93000a]" : "bg-[#ff6d00]";
  const outcomeLabel =
    game.winner !== null
      ? `Winner: ${game.winner}`
      : game.finished
        ? "Time up"
        : `Expected: ${objective.shortcut}`;

  return (
    <div className="relative min-h-svh bg-[#0e0e0e] text-[#e5e2e1] selection:bg-[#ff6d00] selection:text-[#341100]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-home opacity-60" />

      <nav className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#201f1f] bg-[#131313]/95 px-4 shadow-[0_4px_20px_rgba(255,109,0,0.05)] backdrop-blur md:px-8">
        <div className="text-lg font-black tracking-tight text-[#ff6d00] uppercase italic md:text-xl">
          Shortcut Showdown
        </div>

        <div className="hidden h-full items-center gap-8 md:flex">
          <a
            className="flex h-full items-center border-b-2 border-[#ff6d00] pt-1 text-sm tracking-wide text-[#ffb692] uppercase"
            href="#"
          >
            Race
          </a>
          <a className="flex h-full items-center text-sm tracking-wide text-[#e5e2e1]/60 uppercase" href="#">
            Leaderboard
          </a>
          <a className="flex h-full items-center text-sm tracking-wide text-[#e5e2e1]/60 uppercase" href="#">
            Garage
          </a>
        </div>

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

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 md:px-8 md:py-8">
        <section className="flex w-full items-end justify-between gap-4 md:-ml-8">
          <div className="border-l-4 border-[#ffb692] bg-[#131313]/95 p-5 shadow-[0_0_30px_rgba(255,109,0,0.08)] md:p-6">
            <div className="text-xs tracking-[0.18em] text-[#ffb692] uppercase">Current WPM</div>
            <div className="text-5xl font-bold tracking-tighter text-[#e5e2e1] drop-shadow-[0_0_10px_rgba(255,109,0,0.45)] md:text-6xl">
              {game.wpm}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="bg-[#1c1b1b] px-3 py-2 text-right md:px-4 md:py-3">
              <div className="text-[10px] tracking-[0.16em] text-[#a98a7c] uppercase">Time Left</div>
              <div className="text-lg text-[#ffb692] md:text-xl">{formatTime(game.timeLeft)}</div>
            </div>
            <div className="bg-[#1c1b1b] px-3 py-2 text-right md:px-4 md:py-3">
              <div className="text-[10px] tracking-[0.16em] text-[#a98a7c] uppercase">Accuracy</div>
              <div className="text-lg text-[#e5e2e1] md:text-xl">{game.accuracy.toFixed(1)}%</div>
            </div>
            <div className="bg-linear-to-br from-[#1c1b1b] to-[#353534] px-3 py-2 text-right md:px-4 md:py-3">
              <div className="text-[10px] tracking-[0.16em] text-[#ffb692] uppercase">Streak</div>
              <div className="text-lg font-bold text-[#ffcf8f] md:text-xl">x{game.streak}</div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border border-[#353534] bg-[#2a2a2a]/60 p-6 shadow-[0_0_20px_rgba(255,109,0,0.15)] backdrop-blur md:p-16">
          <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-[#353534] via-[#ff6d00] to-[#353534] opacity-60" />

          <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 md:gap-8">
            <span className="border-l-2 border-[#ffb692] bg-[#0e0e0e] px-4 py-1 text-xs tracking-[0.28em] text-[#ffb692] uppercase">
              Active Objective
            </span>

            <div className="text-center text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              <span className="text-[#e5e2e1]/55">Select text and </span>
              <span className="text-[#e5e2e1] uppercase drop-shadow-[0_0_10px_rgba(255,109,0,0.55)]">
                {objective.command}
              </span>
              <span className="text-[#e5e2e1]/55">.</span>
            </div>

            <div className="relative mt-1 w-full max-w-2xl">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-lg text-[#ffb692]">
                &gt;
              </span>
              <input
                ref={inputRef}
                aria-label="Type the shortcut"
                autoComplete="off"
                className={`w-full border-none py-4 pr-4 pl-12 text-xl tracking-[0.12em] text-[#e5e2e1] outline-none transition-all md:text-2xl ${inputVisualClass}`}
                disabled={game.finished}
                placeholder={game.finished ? "Round complete" : "Press Ctrl/Cmd + key or type shortcut and press Enter"}
                spellCheck={false}
                value={entry}
                onChange={(event) => setEntry(event.target.value)}
                onKeyDown={handleInputKeyDown}
              />
              <div
                className={`pointer-events-none absolute inset-0 animate-pulse mix-blend-screen opacity-10 ${overlayColorClass}`}
              />
            </div>

            <p className="text-xs tracking-[0.2em] text-[#a98a7c] uppercase md:text-sm">{outcomeLabel}</p>
          </div>
        </section>

        <section className="mt-1 flex w-full flex-col gap-3 md:mt-4">
          <h2 className="mb-2 text-sm tracking-[0.16em] text-[#a98a7c] uppercase">Live Telemetry</h2>

          <div className="relative h-16 bg-[#1c1b1b]">
            <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#594136] opacity-30" />
            <div
              className="absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 transition-[left] duration-500 ease-out"
              style={{ left: `${game.race.you.toFixed(1)}%` }}
            >
              <span className="text-xs font-bold text-[#ffb692]">YOU</span>
              <div className="flex size-10 items-center justify-center border-l-2 border-[#ffcf8f] bg-[#2a2a2a] shadow-[0_0_15px_rgba(255,109,0,0.2)]">
                <IconUser className="size-5 text-[#ffcf8f]" />
              </div>
            </div>
          </div>

          <div className="relative h-16 bg-[#131313]">
            <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#594136] opacity-30" />
            <div
              className="absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 opacity-75 transition-[left] duration-500 ease-out"
              style={{ left: `${game.race.opp1.toFixed(1)}%` }}
            >
              <div className="flex size-10 items-center justify-center border-l-2 border-[#ffcf8f] bg-[#2a2a2a]">
                <IconUser className="size-5 text-[#ffcf8f]" />
              </div>
              <span className="text-xs font-bold text-[#a98a7c]">OPP_1</span>
            </div>
          </div>

          <div className="relative h-16 bg-[#1c1b1b]">
            <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#594136] opacity-30" />
            <div
              className="absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 opacity-55 transition-[left] duration-500 ease-out"
              style={{ left: `${game.race.opp2.toFixed(1)}%` }}
            >
              <div className="flex size-10 items-center justify-center border-l-2 border-[#a98a7c] bg-[#2a2a2a]">
                <IconUser className="size-5 text-[#a98a7c]" />
              </div>
              <span className="text-xs font-bold text-[#a98a7c]">OPP_2</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
