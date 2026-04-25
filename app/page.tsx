"use client";

import {
  IconLogin,
  IconPlayerPlayFilled,
  IconSquareRoundedPlus,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createLobby, joinLobby, ApiError } from "@/lib/api";
import { formatApiErrorForUi } from "@/lib/api/errors";
import {
  DEFAULT_CALLSIGN,
  loadCallsignFromStorage,
  saveCallsignToStorage,
} from "@/lib/callsign";
import { buildLobbyPath, parseJoinLobbyInput } from "@/lib/lobbyQuery";
import { usePlayerConnection } from "@/lib/realtime/playerConnection";

function connectionLabel(
  status: "disconnected" | "connecting" | "connected" | "reconnecting" | "error",
): { text: string; ok: boolean } {
  if (status === "connected")
    return { text: "Realtime connected", ok: true };
  if (status === "connecting")
    return { text: "Connecting…", ok: false };
  if (status === "reconnecting")
    return { text: "Reconnecting…", ok: false };
  if (status === "error")
    return { text: "Connection failed", ok: false };
  return { text: "Offline", ok: false };
}

export default function Home() {
  const router = useRouter();
  const { status, playerId, lastError, reconnect } = usePlayerConnection();

  const [callsign, setCallsign] = useState(DEFAULT_CALLSIGN);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"create" | "join" | null>(null);

  useEffect(() => {
    setCallsign(loadCallsignFromStorage());
  }, []);

  const onCallsignBlur = useCallback(() => {
    saveCallsignToStorage(callsign);
  }, [callsign]);

  const onCreate = useCallback(async () => {
    setActionError(null);
    if (!playerId) {
      setActionError(
        "Not connected to the server. Wait for the realtime link or try Retry.",
      );
      return;
    }
    setBusy("create");
    try {
      const lobby = await createLobby({ player_id: playerId });
      saveCallsignToStorage(callsign);
      router.replace(buildLobbyPath(lobby));
    } catch (e) {
      setActionError(formatApiErrorForUi(e));
    } finally {
      setBusy(null);
    }
  }, [playerId, router, callsign]);

  const onJoin = useCallback(async () => {
    setActionError(null);
    if (!playerId) {
      setActionError(
        "Not connected to the server. Wait for the realtime link or try Retry.",
      );
      return;
    }
    const parsed = parseJoinLobbyInput(joinCode);
    if (!parsed.ok) {
      setActionError(parsed.message);
      return;
    }
    setBusy("join");
    try {
      const lobby = await joinLobby(parsed.id, { player_id: playerId });
      saveCallsignToStorage(callsign);
      router.replace(buildLobbyPath(lobby));
    } catch (e) {
      if (e instanceof ApiError && e.code === "not_found") {
        setActionError("No lobby found with that code. Check and try again.");
      } else {
        setActionError(formatApiErrorForUi(e));
      }
    } finally {
      setBusy(null);
    }
  }, [playerId, joinCode, router, callsign]);

  const onQuickPlay = useCallback(() => {
    saveCallsignToStorage(callsign);
    router.push("/gameplay");
  }, [router, callsign]);

  const conn = connectionLabel(status);

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

          {actionError && (
            <div
              role="alert"
              className="mb-4 rounded-sm border border-[#c45c4a]/50 bg-[#2a1111]/80 px-3 py-2 text-sm text-[#f0c0b8]"
            >
              {actionError}
            </div>
          )}

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
                onBlur={onCallsignBlur}
              />
            </div>
          </div>

          {showJoin && (
            <div className="mt-4 flex flex-col gap-2">
              <label
                className="text-xs font-medium tracking-[0.2em] text-[#e2bfb0] uppercase"
                htmlFor="join-code"
              >
                Full lobby id
              </label>
              <input
                id="join-code"
                className="w-full rounded-sm border border-[color-mix(in_srgb,#e5e2e1_12%,transparent)] bg-[#0e0e0e] py-3 px-4 font-mono text-sm text-[#e5e2e1] outline-none focus:border-[color-mix(in_srgb,#ff6d00_45%,transparent)]"
                placeholder="paste-uuid-from-invite-link"
                spellCheck={false}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
            </div>
          )}

          <div className="mt-8 flex flex-col gap-4">
            <button
              type="button"
              onClick={onQuickPlay}
              className="relative w-full overflow-hidden rounded-sm bg-linear-to-b from-[#ff9500] via-[#ff7b00] to-[#e85d00] py-4 font-sans text-lg font-bold tracking-[0.12em] text-[#341100] uppercase shadow-[0_0_0_1px_color-mix(in_srgb,#fff_12%,transparent)_inset] transition-[transform,box-shadow] duration-200 hover:shadow-[0_0_32px_color-mix(in_srgb,#ff6d00_45%,transparent),inset_0_0_24px_color-mix(in_srgb,#fff_18%,transparent)] active:scale-[0.99] disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                <IconPlayerPlayFilled className="size-6" aria-hidden />
                Quick Play (local)
              </span>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onCreate}
                disabled={busy !== null}
                className="flex items-center justify-center gap-2 rounded-sm border border-[color-mix(in_srgb,#594136_22%,transparent)] bg-transparent py-3 font-sans text-sm font-semibold tracking-wide text-[#e5e2e1] uppercase transition-[background-color,border-color] duration-200 hover:border-[color-mix(in_srgb,#ff6d00_35%,transparent)] hover:bg-[#353534] disabled:opacity-50"
              >
                <IconSquareRoundedPlus
                  className="size-4 text-[#ffb692]"
                  aria-hidden
                />
                {busy === "create" ? "…" : "Create Lobby"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowJoin((v) => !v);
                  setActionError(null);
                }}
                className="flex items-center justify-center gap-2 rounded-sm border border-[color-mix(in_srgb,#594136_22%,transparent)] bg-transparent py-3 font-sans text-sm font-semibold tracking-wide text-[#e5e2e1] uppercase transition-[background-color,border-color] duration-200 hover:border-[color-mix(in_srgb,#ff6d00_35%,transparent)] hover:bg-[#353534]"
              >
                <IconLogin className="size-4 text-[#ffb692]" aria-hidden />
                {showJoin ? "Hide join" : "Join Lobby"}
              </button>
            </div>
            {showJoin && (
              <button
                type="button"
                onClick={onJoin}
                disabled={busy !== null}
                className="w-full rounded-sm border border-[#ff6d00]/40 bg-[#ff6d00]/10 py-3 font-sans text-sm font-bold tracking-wide text-[#ffb692] uppercase transition-colors hover:bg-[#ff6d00]/20 disabled:opacity-50"
              >
                {busy === "join" ? "Joining…" : "Join with code"}
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-[color-mix(in_srgb,#594136_14%,transparent)] pt-4 text-xs font-medium tracking-[0.18em] text-[#e2bfb0]/60 uppercase">
            <div className="flex items-center justify-between">
              <span>V 2.4.1</span>
              <span
                className={
                  conn.ok
                    ? "flex items-center gap-2 text-[#ffb692]/85"
                    : "flex items-center gap-2 text-[#888888]"
                }
              >
                <span
                  className={
                    conn.ok
                      ? "size-2 animate-pulse rounded-full bg-[#ffb692]"
                      : "size-2 rounded-full bg-[#666]"
                  }
                />
                {conn.text}
              </span>
            </div>
            {(status === "error" || lastError) && status !== "connected" && (
              <div className="flex items-center justify-between normal-case">
                <span className="text-[#c45c4a]/90">
                  {lastError ?? "Realtime unavailable."}
                </span>
                <button
                  type="button"
                  onClick={reconnect}
                  className="text-[#ff6d00] hover:underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
