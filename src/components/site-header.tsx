import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-bg-elevated px-6 py-4">
      <Link href="/" className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan" />
        <span className="font-brand text-sm font-semibold uppercase tracking-[0.22em] text-text">
          Tatari
        </span>
      </Link>
    </header>
  );
}
