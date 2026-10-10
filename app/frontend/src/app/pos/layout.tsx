import { PosRail } from "./_components/PosRail";
import { PosTopBar } from "./_components/PosTopBar";

export default function PosLayout({ children }: LayoutProps<"/pos">) {
  return (
    <div className="flex min-h-dvh">
      <PosRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <PosTopBar />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
