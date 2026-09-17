import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import {
  listQuoteInbox,
  type QuoteInboxItem,
} from "@/lib/services/quote-inbox";

export const dynamic = "force-dynamic";

function formatUsd(value: string): string {
  return `$${value}`;
}

function formatStatus(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function QuotesIndexPage() {
  const inbox = await listQuoteInbox();

  return (
    <main className="mx-auto max-w-3xl space-y-12 px-6 py-14">
      <PageHeader
        kicker="Internal"
        title="Quote review"
        description="Pending quotes first, then decided quotes and unmatched requests."
      />

      <InboxSection
        title="Pending approval"
        empty="No quotes waiting. Matched requests land here."
        items={inbox.pending}
      />
      <InboxSection
        title="Unmatched"
        empty="No unmatched requests."
        items={inbox.noMatch}
      />
      <InboxSection
        title="Decided"
        empty="No approved or rejected quotes yet."
        items={inbox.decided}
      />
    </main>
  );
}

function InboxSection({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: QuoteInboxItem[];
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl text-text">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.requirementId}>
              <Link
                href={`/quotes/${item.requirementId}`}
                className="block rounded-card border border-border bg-surface px-4 py-4 transition-colors hover:border-accent"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium tracking-wide text-text">
                    {item.reference}
                  </p>
                  <p className="text-sm text-text-faint">
                    {item.quote ? formatStatus(item.quote.status) : "no match"}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {item.quantity} × {item.gpuModel} in {item.region} ·{" "}
                  {item.companyName}
                  {item.quote
                    ? ` · ${formatUsd(item.quote.totalEstimatedCostUsd)}`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
