import { z } from "zod";

const approveQuoteSchema = z.strictObject({
  quoteId: z.string().trim().min(1),
  decision: z.literal("approve"),
});

const rejectQuoteSchema = z.strictObject({
  quoteId: z.string().trim().min(1),
  decision: z.literal("reject"),
  reason: z.string().trim().min(1, "A rejection reason is required").max(1_000),
});

export const QuoteDecisionCommandSchema = z.discriminatedUnion("decision", [
  approveQuoteSchema,
  rejectQuoteSchema,
]);

export type QuoteDecisionCommand = z.infer<
  typeof QuoteDecisionCommandSchema
>;
