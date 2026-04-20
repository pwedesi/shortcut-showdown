"use client";

import {
  IconBell,
  IconCheck,
  IconClock,
  IconCopy,
  IconFlame,
  IconLayoutGrid,
  IconPlayerPlayFilled,
  IconPlus,
  IconSettings,
  IconAdjustments,
  IconUser,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

const ACCESS_CODE = "AX79";

/** Lobby shell — dark graphite + #ff8c00 accent. */
const shell = {
  bg: "bg-[#0a0a0a]",
  card: "border border-white/8 bg-[#141414] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  muted: "text-[#888888]",
  accent: "text-[#ff8c00]",
};

export default function LobbyPage() {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/lobby?code=${ACCESS_CODE}`
        : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

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
          <nav className="hidden gap-1 text-[11px] font-bold tracking-[0.2em] md:flex">
            <a
              className={cn(
                "rounded px-3 py-2 transition-colors",
                shell.accent,
                "bg-[#ff8c00]/8 shadow-[inset_0_-2px_0_#ff8c00]",
              )}
              href="#"
              aria-current="page"
            >
              MULTIPLAYER
            </a>
            <a
              className={cn(
                "rounded px-3 py-2 transition-colors hover:bg-white/4",
                shell.muted,
                "hover:text-[#c4c2c0]",
              )}
              href="#"
            >
              RANKINGS
            </a>
            <a
              className={cn(
                "rounded px-3 py-2 transition-colors hover:bg-white/4",
                shell.muted,
                "hover:text-[#c4c2c0]",
              )}
              href="#"
            >
              STORAGE
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-1 text-[#ff8c00]">
          <button
            type="button"
            className="rounded-md p-2.5 transition-colors hover:bg-white/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8c00]"
            aria-label="Settings"
          >
            <IconSettings className="size-6" stroke={1.5} />
          </button>
          <button
            type="button"
            className="rounded-md p-2.5 transition-colors hover:bg-white/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8c00]"
            aria-label="Notifications"
          >
            <IconBell className="size-6" stroke={1.5} />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 justify-center overflow-y-auto px-4 pb-36 pt-8 md:px-8 md:pb-28 md:pt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid-home opacity-[0.12]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-10%] top-[-5%] h-[min(70vh,520px)] w-[min(70vw,520px)] rounded-full bg-[#ff8c00]/6 blur-[120px]"
        />

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
                className="absolute inset-0 bg-linear-to-b from-white/6 to-transparent opacity-30"
              />
              <div
                aria-hidden
                className="absolute bottom-0 left-0 h-0.5 w-full bg-linear-to-r from-transparent via-[#ff8c00] to-transparent shadow-[0_0_12px_rgba(255,140,0,0.5)]"
              />
              <span
                className={cn(
                  "mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.35em]",
                  shell.accent,
                )}
              >
                ACCESS CODE
              </span>
              <h1 className="font-sans text-6xl font-black tracking-[-0.06em] text-white md:text-8xl">
                {ACCESS_CODE}
              </h1>
              <button
                type="button"
                onClick={copyLink}
                className={cn(
                  "group mt-8 flex items-center gap-2.5 rounded-sm px-2 py-1.5 transition-colors",
                  "text-[#ff8c00] hover:bg-[#ff8c00]/10 hover:text-[#ffb366]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8c00]",
                )}
              >
                <span className="flex size-8 items-center justify-center rounded border border-[#ff8c00]/40 bg-[#ff8c00]/7 transition-transform group-hover:border-[#ff8c00]/60">
                  <IconCopy className="size-4" stroke={1.5} aria-hidden />
                </span>
                <span className="text-xs font-bold tracking-[0.25em]">
                  {copied ? "COPIED" : "COPY LINK"}
                </span>
              </button>
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
                <ParamCell label="MODE" value="SPRINT" />
                <ParamCell label="TRACK" value="NEON_04" />
                <ParamCell label="LAPS" value="05" />
                <div className="border border-white/6 bg-[#0c0c0c] p-4">
                  <span
                    className={cn(
                      "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em]",
                      shell.muted,
                    )}
                  >
                    COLLISION
                  </span>
                  <span className="font-mono text-lg font-semibold tracking-wide text-[#c45c4a]">
                    OFF
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-8">
            <div className={cn("flex flex-1 flex-col overflow-hidden", shell.card)}>
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
                  3/8 CONNECTED
                </span>
              </div>

              <div className="flex flex-col gap-3 p-5 md:gap-3.5 md:p-6">
                <div
                  className={cn(
                    "relative flex items-center justify-between gap-3 overflow-hidden",
                    "border border-[#ff8c00]/20 bg-[#1a1a1a] py-3 pl-4 pr-3 md:py-4",
                  )}
                >
                  <div
                    aria-hidden
                    className="absolute bottom-0 left-0 top-0 w-1 bg-linear-to-b from-[#ff8c00] via-[#ffb366] to-[#ff8c00] shadow-[0_0_12px_rgba(255,140,0,0.5)]"
                  />
                  <div className="z-10 flex min-w-0 items-center gap-3 md:gap-4">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center border border-white/8 bg-black/50 font-mono text-lg font-bold",
                        shell.accent,
                      )}
                    >
                      P1
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold uppercase leading-tight tracking-tight text-white md:text-lg">
                        USER_X01 (YOU)
                      </h3>
                      <span className={cn("font-mono text-[11px] tracking-wide", shell.muted)}>
                        LATENCY: 12ms
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "z-10 flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 md:px-4",
                      "bg-linear-to-br from-[#ff8c00] to-[#ff6a00] text-[#2a1200]",
                      "shadow-[0_0_20px_rgba(255,140,0,0.35)]",
                    )}
                  >
                    <IconCheck className="size-4 shrink-0" stroke={2.5} aria-hidden />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                      READY
                    </span>
                  </div>
                </div>

                <PlayerRow slot="P2" name="CYBER_DRIFTER" latency="45ms" />
                <PlayerRow slot="P3" name="NOVA_PULSE" latency="28ms" />

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
              </div>
            </div>

            <button
              type="button"
              className={cn(
                "group relative flex h-18 w-full items-center justify-center gap-3 overflow-hidden rounded-sm transition-all duration-300 md:h-20 md:gap-4",
                "bg-linear-to-r from-[#ff7700] via-[#ff9f4a] to-[#ffc49a]",
                "text-[#3d1800]",
                "shadow-[0_0_0_1px_rgba(255,200,150,0.25)_inset,0_8px_40px_rgba(255,120,0,0.35),0_0_60px_rgba(255,140,0,0.2)]",
                "hover:shadow-[0_0_0_1px_rgba(255,220,190,0.35)_inset,0_12px_48px_rgba(255,120,0,0.45),0_0_80px_rgba(255,160,80,0.25)]",
                "active:scale-[0.99]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8c00]",
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
              <IconPlayerPlayFilled className="relative size-8 shrink-0 md:size-9" />
              <span className="relative font-sans text-xl font-black uppercase tracking-[0.18em] md:text-2xl">
                INITIATE LAUNCH
              </span>
            </button>
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
    </div>
  );
}

function ParamCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/6 bg-[#0c0c0c] p-4">
      <span
        className={cn(
          "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em]",
          "text-[#888888]",
        )}
      >
        {label}
      </span>
      <span className="font-mono text-lg font-medium tracking-wide text-white">
        {value}
      </span>
    </div>
  );
}

function PlayerRow({
  slot,
  name,
  latency,
}: {
  slot: string;
  name: string;
  latency: string;
}) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-3 border border-white/6 bg-[#1a1a1a] py-3 pl-4 pr-3 transition-colors hover:border-white/10 md:py-4",
      )}
    >
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center border border-white/8 bg-black/50 font-mono text-lg font-bold",
            "text-[#a8a6a4]",
          )}
        >
          {slot}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold uppercase leading-tight tracking-tight text-white md:text-lg">
            {name}
          </h3>
          <span className={cn("font-mono text-[11px] tracking-wide", shell.muted)}>
            LATENCY: {latency}
          </span>
        </div>
      </div>
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
    </div>
  );
}
