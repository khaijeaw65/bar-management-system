import { Suspense } from "react";
import { PayScreen } from "./_components/PayScreen";

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-surface-raised" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="h-20 animate-pulse rounded bg-surface-raised" />
            <div className="h-20 animate-pulse rounded bg-surface-raised" />
            <div className="h-20 animate-pulse rounded bg-surface-raised" />
            <div className="h-20 animate-pulse rounded bg-surface-raised" />
          </div>
        </div>
      }
    >
      <PayScreen />
    </Suspense>
  );
}
