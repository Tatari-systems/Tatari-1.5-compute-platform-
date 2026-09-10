import { z } from "zod";

import {
  compareDecimalStrings,
  DecimalStringSchema,
  UsdAmountSchema,
} from "./money";

const positiveDecimalSchema = DecimalStringSchema.refine(
  (value) => compareDecimalStrings(value, "0") > 0,
  "Amount must be greater than zero",
);

const positiveUsdAmountSchema = UsdAmountSchema.refine(
  (value) => compareDecimalStrings(value, "0") > 0,
  "Amount must be greater than zero",
);

export const QuoteLineItemSnapshotSchema = z.strictObject({
  supplyId: z.string().trim().min(1),
  vendorId: z.string().trim().min(1),
  gpuModel: z.string().trim().min(1).max(80),
  region: z.string().trim().min(1).max(100),
  quantity: z.int().min(1).max(10_000),
  hourlyPriceUsd: positiveDecimalSchema,
  billableHours: z.int().min(1),
  supplierSubtotalUsd: positiveUsdAmountSchema,
  marginBps: z.int().min(0).max(10_000),
  platformFeeUsd: UsdAmountSchema,
  totalEstimatedCostUsd: positiveUsdAmountSchema,
  minimumUptimeBps: z.int().min(1).max(10_000),
});

export const CreateQuoteCommandSchema = z.strictObject({
  requirementId: z.string().trim().min(1),
  expiresAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value)),
  lineItems: z.array(QuoteLineItemSnapshotSchema).min(1).max(100),
});

export type QuoteLineItemSnapshot = z.infer<typeof QuoteLineItemSnapshotSchema>;
export type CreateQuoteCommandInput = z.input<typeof CreateQuoteCommandSchema>;
export type CreateQuoteCommand = z.output<typeof CreateQuoteCommandSchema>;
