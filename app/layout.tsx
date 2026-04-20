import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Shortcut Showdown",
  description: "Race using real keyboard knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark h-full",
        "antialiased",
        GeistSans.variable,
        GeistMono.variable,
        "font-sans",
        spaceGrotesk.variable,
      )}
    >
      <body className="flex min-h-full min-h-svh flex-col overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
