import Link from "next/link";
import {
  IconGauge,
  IconHome,
  IconPlayerPlayFilled,
  IconUsersPlus,
} from "@tabler/icons-react";

type PodiumEntry = {
  place: 1 | 2 | 3;
  name: string;
  wpm: number;
  initials: string;
  highlighted?: boolean;
};

const podium: PodiumEntry[] = [
  { place: 2, name: "NEO_BYTE", wpm: 98, initials: "NB" },
  {
    place: 1,
    name: "OPERATOR_01",
    wpm: 112,
    initials: "OP",
    highlighted: true,
  },
  { place: 3, name: "SYNTAX_ERR", wpm: 92, initials: "SE" },
];

const accuracy = 94;
const accuracyRadius = 36;
const accuracyCircumference = 2 * Math.PI * accuracyRadius;
const accuracyOffset = accuracyCircumference * (1 - accuracy / 100);

export default function ResultsPage() {
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
            <h1 className="text-5xl font-black tracking-tight text-[#ff7d1f] drop-shadow-[0_0_16px_rgba(255,109,0,0.45)] md:text-7xl">
              RACE COMPLETE
            </h1>
            <p className="mt-2 text-xs font-medium tracking-[0.25em] text-[#ffb692] uppercase md:text-sm">
              SESSION TELEMETRY INITIALIZED
            </p>
          </header>

          <div className="mx-auto flex max-w-xl items-end justify-center gap-3 sm:gap-5 lg:mx-0">
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
                  key={entry.name}
                  className={`relative flex w-24 flex-col items-center sm:w-28 ${
                    isFirst ? "-translate-y-8" : ""
                  }`}
                >
                  {isFirst ? (
                    <span className="mb-3 rounded-sm bg-[#ff6d00]/20 px-3 py-1 text-[11px] font-black tracking-wide text-[#ffb692] shadow-[0_0_14px_rgba(255,109,0,0.3)]">
                      VICTOR
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
                  <p className="text-sm text-[#d0cdcb]">Target vs Actual</p>
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
                    {accuracy}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#2a2a2a] bg-[#090909] p-4">
                  <p className="text-[11px] tracking-[0.2em] text-[#a8a2a0] uppercase">
                    Avg Reaction
                  </p>
                  <p className="mt-2 text-4xl leading-none font-bold tracking-tight text-[#ece9e7]">
                    214
                    <span className="ml-1 text-xs text-[#ffb692]">ms</span>
                  </p>
                </div>

                <div className="border border-[#2a2a2a] bg-[#090909] p-4">
                  <p className="text-[11px] tracking-[0.2em] text-[#a8a2a0] uppercase">
                    Error Rate
                  </p>
                  <div className="mt-2 flex items-end gap-4">
                    <div>
                      <p className="text-xs text-[#d0cdcb]">Correct</p>
                      <p className="text-3xl leading-none font-bold text-[#ece9e7]">
                        342
                      </p>
                    </div>
                    <div className="h-8 w-px bg-[#2f2f2f]" />
                    <div>
                      <p className="text-xs text-[#ff9d90]">Miss</p>
                      <p className="text-3xl leading-none font-bold text-[#d44f43]">
                        12
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <div className="mb-1 flex items-end justify-between">
                  <p className="text-[11px] tracking-[0.2em] text-[#a8a2a0] uppercase">
                    XP Gained
                  </p>
                  <p className="text-sm font-bold text-[#ffd08d]">+450 XP</p>
                </div>
                <div className="h-3 overflow-hidden border border-[#2a2a2a] bg-[#090909]">
                  <div className="h-full w-3/4 bg-linear-to-r from-[#ffb467] to-[#f9cb8a] shadow-[0_0_14px_rgba(255,183,108,0.5)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-[#d36f20] bg-linear-to-r from-[#d46008] to-[#d09060] px-5 py-3.5 text-sm font-black tracking-[0.12em] text-[#1d1208] uppercase transition hover:brightness-105"
            >
              <IconPlayerPlayFilled className="size-4" />
              Rematch
            </Link>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Link
                href="/lobby"
                className="flex items-center justify-center gap-2 rounded-sm border border-[#252525] bg-[#0d0d10] px-5 py-3 text-sm font-bold tracking-[0.12em] text-[#ece9e7] uppercase transition hover:bg-[#17171a]"
              >
                <IconUsersPlus className="size-4" />
                New Lobby
              </Link>

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
