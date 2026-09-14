import type { Metadata } from "next";

import { RequirementForm } from "./requirement-form";

export const metadata: Metadata = {
  title: "Request GPU capacity",
  description: "Submit a GPU capacity requirement for Tatari review.",
};

export default function QuotePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <section className="space-y-4">
        <p className="font-brand text-xs font-semibold uppercase tracking-[0.28em] text-text-faint">
          Public intake
        </p>
        <h1 className="font-display text-4xl leading-tight text-text sm:text-5xl">
          Request GPU capacity
        </h1>
        <p className="max-w-2xl text-base leading-7 text-text-muted">
          Tell us what you need. Tatari will review the request. Submitting this
          form does not reserve GPUs, create a quote, or confirm pricing.
        </p>
      </section>
      <RequirementForm />
    </main>
  );
}
