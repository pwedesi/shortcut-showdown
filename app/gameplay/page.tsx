import { Suspense } from "react";
import { GameplayClient } from "./GameplayClient";

function GameplayLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0e0e0e] text-[#ffb692]">
      Loading…
    </div>
  );
}

export default function GameplayPage() {
  return (
    <Suspense fallback={<GameplayLoading />}>
      <GameplayClient />
    </Suspense>
  );
}
