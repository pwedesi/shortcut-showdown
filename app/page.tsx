"use client";

import {
  IconLogin,
  IconPlayerPlayFilled,
  IconSquareRoundedPlus,
} from "@tabler/icons-react";
import { useState } from "react";

export default function Home() {
  const [callsign, setCallsign] = useState("OPERATOR_01");

  return (
    <div className="relative isolate flex min-h-svh w-full flex-col bg-[#0a0a0a] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-home opacity-90"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-[min(28rem,55vw)] w-[min(28rem,55vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6d00] opacity-[0.14] blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[12%] right-[8%] h-[min(32rem,70vw)] w-[min(32rem,70vw)] rounded-full bg-[#feaa00] opacity-[0.09] blur-[160px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[20%] left-[12%] h-72 w-72 rounded-full bg-[#ff6d00] opacity-[0.06] blur-[100px]"
      />

      <main className="relative z-10 flex min-h-svh w-full flex-col items-center justify-center px-4 py-12 md:px-8">
        <div className="mb-12 flex flex-col items-center md:mb-16">
          <h1 className="glow-title-home text-center font-sans text-5xl font-black italic leading-[0.95] tracking-tighter text-[#ff7b00] uppercase md:text-7xl">
            Shortcut
            <br />
            Showdown
          </h1>
          <p className="mt-5 max-w-xl text-center text-sm font-medium tracking-[0.35em] text-[#ffb692] uppercase opacity-95 md:text-base md:tracking-[0.4em]">
            Race using real keyboard knowledge
          </p>
        </div>

        <div className="glass-panel-home relative w-full max-w-md overflow-hidden rounded-sm border border-[color-mix(in_srgb,#594136_18%,transparent)] px-8 py-8">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#ff6d00] to-transparent opacity-60"
          />

          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-medium tracking-[0.2em] text-[#e2bfb0] uppercase"
              htmlFor="callsign"
            >
              Player Callsign
            </label>
            <div className="group relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#ff6d00]/75 select-none">
                &gt;_
              </span>
              <input
                id="callsign"
                autoComplete="username"
                className="w-full rounded-sm border border-[color-mix(in_srgb,#e5e2e1_12%,transparent)] bg-[#0e0e0e] py-3.5 pr-4 pl-12 font-mono text-base text-[#e5e2e1] outline-none transition-[background-color,border-color,box-shadow] placeholder:text-[#e5e2e1]/35 focus:border-[color-mix(in_srgb,#ff6d00_45%,transparent)] focus:bg-[#1c1b1b] focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,#ff6d00_35%,transparent)] group-hover:bg-[#131313]"
                placeholder="ENTER NICKNAME_"
                spellCheck={false}
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <button
              type="button"
              className="relative w-full overflow-hidden rounded-sm bg-linear-to-b from-[#ff9500] via-[#ff7b00] to-[#e85d00] py-4 font-sans text-lg font-bold tracking-[0.12em] text-[#341100] uppercase shadow-[0_0_0_1px_color-mix(in_srgb,#fff_12%,transparent)_inset] transition-[transform,box-shadow] duration-200 hover:shadow-[0_0_32px_color-mix(in_srgb,#ff6d00_45%,transparent),inset_0_0_24px_color-mix(in_srgb,#fff_18%,transparent)] active:scale-[0.99]"
            >
              <span className="flex items-center justify-center gap-2">
                <IconPlayerPlayFilled className="size-6" aria-hidden />
                Quick Play
              </span>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-sm border border-[color-mix(in_srgb,#594136_22%,transparent)] bg-transparent py-3 font-sans text-sm font-semibold tracking-wide text-[#e5e2e1] uppercase transition-[background-color,border-color] duration-200 hover:border-[color-mix(in_srgb,#ff6d00_35%,transparent)] hover:bg-[#353534]"
              >
                <IconSquareRoundedPlus
                  className="size-4 text-[#ffb692]"
                  aria-hidden
                />
                Create Lobby
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-sm border border-[color-mix(in_srgb,#594136_22%,transparent)] bg-transparent py-3 font-sans text-sm font-semibold tracking-wide text-[#e5e2e1] uppercase transition-[background-color,border-color] duration-200 hover:border-[color-mix(in_srgb,#ff6d00_35%,transparent)] hover:bg-[#353534]"
              >
                <IconLogin className="size-4 text-[#ffb692]" aria-hidden />
                Join Lobby
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[color-mix(in_srgb,#594136_14%,transparent)] pt-4 text-xs font-medium tracking-[0.18em] text-[#e2bfb0]/60 uppercase">
            <span>V 2.4.1</span>
            <span className="flex items-center gap-2 text-[#ffb692]/85">
              <span className="size-2 animate-pulse rounded-full bg-[#ffb692]" />
              Server Online
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
