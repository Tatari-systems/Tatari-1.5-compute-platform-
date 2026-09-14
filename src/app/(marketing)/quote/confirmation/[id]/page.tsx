import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isRequirementId } from "@/lib/requirements/reference";
import { getRequirementConfirmation } from "@/lib/services/requirements";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request received",
};

const workloadLabels: Record<string, string> = {
  ai_training: "AI training",
  fine_tuning: "Fine-tuning",
  inference: "Inference",
  research: "Research",
  other: "Other",
};

function formatUtc(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function RequirementConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isRequirementId(id)) {
    notFound();
  }

  const confirmation = await getRequirementConfirmation(id);

  if (!confirmation) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <section className="space-y-8">
        <div className="space-y-4">
          <p className="font-brand text-xs font-semibold uppercase tracking-[0.28em] text-text-faint">
            Request received
          </p>
          <h1 className="font-display text-4xl leading-tight text-text sm:text-5xl">
            We have your request
          </h1>
          <p className="max-w-2xl text-base leading-7 text-text-muted">
            Tatari will review this request. This confirmation does not mean a
            match, quote, price, or response time.
          </p>
        </div>
        <dl className="grid gap-6 rounded-card border border-border bg-surface p-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-text-faint">Request reference</dt>
            <dd className="mt-1 font-medium tracking-wide text-text">
              {confirmation.reference}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text-faint">Submitted</dt>
            <dd className="mt-1 font-medium text-text">
              {formatUtc(confirmation.createdAt)} UTC
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-text-faint">Summary</dt>
            <dd className="mt-1 leading-7 text-text-muted">
              {confirmation.summary.quantity} × {confirmation.summary.gpuModel}{" "}
              in {confirmation.summary.region} for{" "}
              {workloadLabels[confirmation.summary.workloadType] ??
                confirmation.summary.workloadType}
              , from {formatUtc(confirmation.summary.timeframeStart)} to{" "}
              {formatUtc(confirmation.summary.timeframeEnd)} UTC. Maximum budget
              ${confirmation.summary.budgetMaxUsd}. Company:{" "}
              {confirmation.summary.companyName}.
            </dd>
          </div>
        </dl>
        <p className="text-sm leading-6 text-text-muted">
          If this request needs a correction, contact the Tatari team and
          include your request reference.
        </p>
        <Link
          href="/quote"
          className="inline-flex text-sm text-accent transition-colors hover:text-text"
        >
          Submit another request
        </Link>
      </section>
    </main>
  );
}
