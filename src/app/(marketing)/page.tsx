import Link from "next/link";

import { TatariLogo } from "@/components/tatari-logo";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-3xl items-center px-6 py-16">
      <section aria-labelledby="release-title" className="space-y-8">
        <TatariLogo size={64} priority />
        <p className="font-brand text-xs font-semibold uppercase tracking-[0.28em] text-text-faint">
          Tatari Systems
        </p>
        <div className="space-y-4">
          <h1
            id="release-title"
            className="font-display text-5xl leading-tight text-text sm:text-6xl"
          >
            Release A foundation
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-text-muted">
            The internal quote-to-commit workflow starts with validated
            requirements, deterministic matching, human approval, and an
            auditable pending-delivery commitment.
          </p>
        </div>
        <p className="max-w-2xl border-l border-accent pl-4 text-sm leading-6 text-text-muted">
          This foundation does not include marketplace browsing, live provider
          inventory, provisioning, billing, or white-label features.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/quote"
            className="inline-flex rounded-control bg-accent-strong px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-accent"
          >
            Submit a GPU requirement
          </Link>
          <Link
            href="/quotes"
            className="inline-flex rounded-control border border-white/15 bg-white/8 px-4 py-2.5 text-[13px] text-text transition-colors hover:bg-white/12"
          >
            Quote review
          </Link>
        </div>
      </section>
    </main>
  );
}
