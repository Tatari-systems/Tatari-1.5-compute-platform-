"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { decideQuoteAction } from "@/lib/api/quotes";

const fieldClass =
  "mt-1.5 w-full rounded-control border border-border bg-surface px-3 py-2.5 text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent";

export function QuoteDecisionForm({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function submit(decision: "approve" | "reject") {
    setFormError(null);
    setPending(decision);

    try {
      const result = await decideQuoteAction(
        decision === "approve"
          ? { quoteId, decision }
          : { quoteId, decision, reason },
      );

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-text">Decision</h2>
      <p className="text-sm text-text-faint">
        Approval creates a pending-delivery commitment. Rejection requires a
        reason and does not create a commitment.
      </p>
      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void submit("approve")}
          className="rounded-control bg-accent-strong px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "approve" ? "Approving…" : "Approve quote"}
        </button>
      </div>
      <div>
        <label
          className="text-sm font-medium text-text"
          htmlFor="reject-reason"
        >
          Rejection reason
        </label>
        <textarea
          id="reject-reason"
          name="reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={fieldClass}
          disabled={pending !== null}
        />
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void submit("reject")}
          className="mt-3 rounded-control border border-border px-4 py-2.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "reject" ? "Rejecting…" : "Reject quote"}
        </button>
      </div>
    </div>
  );
}
