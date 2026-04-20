import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lobby",
  description: "Multiplayer lobby — access code, grid, and launch.",
};

export default function LobbyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
