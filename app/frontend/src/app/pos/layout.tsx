import { Utensils } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PosLayout({ children }: LayoutProps<"/pos">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
        <p className="text-base font-semibold">The Loft Bar</p>
        <ThemeToggle />
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="w-[220px] shrink-0 border-r border-border bg-bg p-3">
          <Link
            href="/pos/menu"
            className="flex items-center gap-2 rounded-lg bg-accent-subtle px-3 py-2 text-sm font-medium text-accent-text"
          >
            <Utensils size={20} strokeWidth={1.5} aria-hidden />
            เมนู / สต็อก
          </Link>
        </nav>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
