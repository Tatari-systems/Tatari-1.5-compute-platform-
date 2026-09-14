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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <section className="space-y-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Request received
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
          We have your request
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-400">
          Tatari will review this request. This confirmation does not mean a
          match, quote, price, or response time.
        </p>
        <dl className="grid gap-4 border border-zinc-800 bg-zinc-950 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-zinc-500">Request reference</dt>
            <dd className="mt-1 font-medium text-zinc-100">
              {confirmation.reference}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">Submitted</dt>
            <dd className="mt-1 font-medium text-zinc-100">
              {formatUtc(confirmation.createdAt)} UTC
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-zinc-500">Summary</dt>
            <dd className="mt-1 text-zinc-200">
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
        <p className="text-sm leading-6 text-zinc-400">
          If this request needs a correction, contact the Tatari team and
          include your request reference.
        </p>
        <Link href="/quote" className="inline-block text-sm text-blue-400">
          Submit another request
        </Link>
      </section>
    </main>
  );
}
