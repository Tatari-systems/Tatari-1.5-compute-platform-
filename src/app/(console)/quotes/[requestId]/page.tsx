import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getQuoteReview } from "@/lib/matching/proposeQuote";
import { isRequirementId } from "@/lib/requirements/reference";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal quote review",
};

function formatUtc(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatUptime(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

export default async function InternalQuotePage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  if (!isRequirementId(requestId)) {
    notFound();
  }

  const review = await getQuoteReview(requestId);

  if (!review) {
    notFound();
  }

  const offer = review.quote?.lineItems[0];

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <section className="space-y-8">
        <div className="space-y-4">
          <p className="font-brand text-xs font-semibold uppercase tracking-[0.28em] text-text-faint">
            Quote review
          </p>
          <h1 className="font-display text-4xl leading-tight text-text sm:text-5xl">
            {review.requirement.reference}
          </h1>
          <p className="text-text-muted">
            Requirement status: {review.requirement.status.replaceAll("_", " ")}
            {review.quote
              ? ` · Quote ${review.quote.status.replaceAll("_", " ")}`
              : ""}
          </p>
        </div>

        <dl className="grid gap-6 rounded-card border border-border bg-surface p-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-text-faint">Company</dt>
            <dd className="mt-1 text-text">{review.requirement.companyName}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-faint">Contact</dt>
            <dd className="mt-1 text-text">{review.requirement.contactName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-text-faint">Request</dt>
            <dd className="mt-1 leading-7 text-text-muted">
              {review.requirement.quantity} × {review.requirement.gpuModel} in{" "}
              {review.requirement.region},{" "}
              {formatUtc(review.requirement.timeframeStart)} to{" "}
              {formatUtc(review.requirement.timeframeEnd)} UTC. Maximum budget $
              {review.requirement.budgetMaxUsd}. Minimum uptime{" "}
              {formatUptime(review.requirement.minimumUptimeBps)}.
            </dd>
          </div>
        </dl>

        {review.quote && offer ? (
          <section className="space-y-3 rounded-card border border-border bg-surface p-6">
            <h2 className="font-display text-2xl text-text">Proposed offer</h2>
            <p className="text-sm text-text-faint">
              This is the quote under review. Candidate rows below are not
              alternatives for approval.
            </p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-text-faint">Supply</dt>
                <dd className="mt-1 text-text">
                  {offer.quantity} × {offer.gpuModel} in {offer.region}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-text-faint">Vendor</dt>
                <dd className="mt-1 text-text">{offer.vendorId}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-faint">Hourly price</dt>
                <dd className="mt-1 text-text">${offer.hourlyPriceUsd}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-faint">SLA</dt>
                <dd className="mt-1 text-text">
                  {formatUptime(offer.minimumUptimeBps)} claimed uptime
                </dd>
              </div>
              <div>
                <dt className="text-sm text-text-faint">Billable hours</dt>
                <dd className="mt-1 text-text">{offer.billableHours}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-faint">Supplier subtotal</dt>
                <dd className="mt-1 text-text">${offer.supplierSubtotalUsd}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-faint">Platform fee</dt>
                <dd className="mt-1 text-text">
                  ${offer.platformFeeUsd} ({offer.marginBps} bps)
                </dd>
              </div>
              <div>
                <dt className="text-sm text-text-faint">Estimated total</dt>
                <dd className="mt-1 text-text">
                  ${review.quote.totalEstimatedCostUsd}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-text-faint">Expires</dt>
                <dd className="mt-1 text-text">
                  {formatUtc(review.quote.expiresAt)} UTC
                </dd>
              </div>
            </dl>
          </section>
        ) : (
          <section className="rounded-card border border-border bg-surface p-6">
            <h2 className="font-display text-2xl text-text">No quote</h2>
            <p className="mt-2 text-text-muted">
              {review.requirement.status === "no_match"
                ? "No eligible GPU supply matched this request. A quote was not created."
                : "Matching has not produced a quote yet."}
            </p>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-text">Eligible supply</h2>
          {review.matches.length === 0 ? (
            <p className="text-text-muted">No eligible supply records.</p>
          ) : (
            <ul className="space-y-3">
              {review.matches.map((match) => (
                <li
                  key={match.supplyId}
                  className="rounded-card border border-border bg-surface px-4 py-3 text-sm"
                >
                  <p className="text-text">
                    {match.gpuModel} in {match.region} · {match.vendorId}
                  </p>
                  <p className="mt-1 text-text-muted">
                    Estimated ${match.totalEstimatedCostUsd} · score{" "}
                    {match.score}
                    {match.selected ? " · selected for this quote" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
