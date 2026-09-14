import Link from "next/link";
import type { ReactNode } from "react";

export default function MarketingLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500"
        >
          Tatari Systems
        </Link>
      </header>
      {children}
    </div>
  );
}
