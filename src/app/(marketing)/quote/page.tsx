import type { Metadata } from "next";

import { RequirementForm } from "./requirement-form";

export const metadata: Metadata = {
  title: "Request GPU capacity",
  description: "Submit a GPU capacity requirement for Tatari review.",
};

export default function QuotePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Public intake
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
          Request GPU capacity
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-400">
          Tell us what you need. Tatari will review the request. Submitting this
          form does not reserve GPUs, create a quote, or confirm pricing.
        </p>
      </section>
      <RequirementForm />
    </main>
  );
}
