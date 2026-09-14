import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section aria-labelledby="release-title" className="space-y-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Tatari Systems
        </p>
        <div className="space-y-3">
          <h1
            id="release-title"
            className="text-4xl font-semibold tracking-tight text-zinc-100 sm:text-5xl"
          >
            Release A foundation
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-400">
            The internal quote-to-commit workflow starts with validated
            requirements, deterministic matching, human approval, and an
            auditable pending-delivery commitment.
          </p>
        </div>
        <p className="border-l border-blue-500 pl-4 text-sm leading-6 text-zinc-400">
          This foundation does not include marketplace browsing, live provider
          inventory, provisioning, billing, or white-label features.
        </p>
        <Link
          href="/quote"
          className="inline-flex text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          Submit a GPU requirement
        </Link>
      </section>
    </main>
  );
}
