import { PosRail } from "./_components/PosRail";
import { PosTopBar } from "./_components/PosTopBar";
import { SessionGate } from "./_components/SessionGate";

export default function PosLayout({ children }: LayoutProps<"/pos">) {
  return (
    <SessionGate>
      <div className="flex min-h-dvh">
        <PosRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <PosTopBar />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col p-6">{children}</main>
        </div>
      </div>
    </SessionGate>
  );
}
