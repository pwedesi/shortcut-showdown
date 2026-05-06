import { Suspense } from "react";
import { ResultsClient } from "./ResultsClient";

function ResultsLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#090909] text-[#ffb692]">
      Loading…
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoading />}>
      <ResultsClient />
    </Suspense>
  );
}
