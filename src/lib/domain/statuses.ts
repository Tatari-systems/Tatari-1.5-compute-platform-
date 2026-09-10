export const REQUIREMENT_STATUSES = [
  "submitted",
  "matched",
  "no_match",
] as const;

export const QUOTE_STATUSES = [
  "pending_approval",
  "approved",
  "rejected",
] as const;

export const COMMITMENT_STATUSES = ["pending_delivery"] as const;

export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];

const requirementTransitions = {
  submitted: ["matched", "no_match"],
  matched: [],
  no_match: [],
} as const satisfies Record<RequirementStatus, readonly RequirementStatus[]>;

const quoteTransitions = {
  pending_approval: ["approved", "rejected"],
  approved: [],
  rejected: [],
} as const satisfies Record<QuoteStatus, readonly QuoteStatus[]>;

export function canTransitionRequirement(
  from: RequirementStatus,
  to: RequirementStatus,
): boolean {
  return (
    requirementTransitions[from] as readonly RequirementStatus[]
  ).includes(to);
}

export function canTransitionQuote(
  from: QuoteStatus,
  to: QuoteStatus,
): boolean {
  return (quoteTransitions[from] as readonly QuoteStatus[]).includes(to);
}
