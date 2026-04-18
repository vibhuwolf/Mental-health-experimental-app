import Link from "next/link";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/40 bg-white/70 px-5 py-3 backdrop-blur">
          <Link href="/" className="text-sm uppercase tracking-[0.35em] text-[var(--muted-foreground)]">
            MOODDROP
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--foreground)]">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/check-in">Check-in</Link>
            <Link href="/replay">Replay</Link>
            <Link href="/spiral?direct=1">Spiral mode</Link>
          </div>
        </nav>
        {children}
      </div>
    </div>
  );
}
