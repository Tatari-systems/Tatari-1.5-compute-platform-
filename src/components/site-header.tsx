import Link from "next/link";

import { TatariLogo } from "@/components/tatari-logo";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-bg-elevated px-6 py-4">
      <Link href="/" className="inline-flex items-center gap-3">
        <TatariLogo size={28} priority />
        <span className="font-brand text-sm font-semibold uppercase tracking-[0.22em] text-text">
          Tatari
        </span>
      </Link>
    </header>
  );
}
