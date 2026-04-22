"use client";

import type { ReactNode } from "react";
import { PlayerConnectionProvider } from "@/lib/realtime/playerConnection";

export function Providers({ children }: { children: ReactNode }) {
  return <PlayerConnectionProvider>{children}</PlayerConnectionProvider>;
}
