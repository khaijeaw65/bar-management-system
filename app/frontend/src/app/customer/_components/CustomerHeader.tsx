import type { CustomerSession } from "@bar/contracts";

export function CustomerHeader({ session }: Readonly<{ session: CustomerSession }>) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line-hairline bg-surface-bar px-4 py-3 backdrop-blur-(--blur-bar)">
      <h1 className="text-heading text-text-body">โต๊ะ {session.seat.label}</h1>
      {session.displayName ? <span className="text-small text-text-muted">· {session.displayName}</span> : null}
    </header>
  );
}
