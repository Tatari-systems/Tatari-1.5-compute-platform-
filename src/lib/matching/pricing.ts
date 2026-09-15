import { Prisma } from "@/generated/prisma/client";

import { compareDecimalStrings } from "@/lib/validation";

export const PLATFORM_MARGIN_BPS = 1000;
export const QUOTE_EXPIRY_DAYS = 7;
const MS_PER_HOUR = 60 * 60 * 1000;

export type QuotePrice = {
  billableHours: number;
  supplierSubtotalUsd: string;
  marginBps: number;
  platformFeeUsd: string;
  totalEstimatedCostUsd: string;
};

export function billableHoursUtc(
  timeframeStart: Date,
  timeframeEnd: Date,
): number {
  const durationMs = timeframeEnd.getTime() - timeframeStart.getTime();
  if (durationMs <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(durationMs / MS_PER_HOUR));
}

export function priceQuote(input: {
  hourlyPriceUsd: string;
  quantity: number;
  timeframeStart: Date;
  timeframeEnd: Date;
  marginBps?: number;
}): QuotePrice {
  const hours = billableHoursUtc(input.timeframeStart, input.timeframeEnd);
  const marginBps = input.marginBps ?? PLATFORM_MARGIN_BPS;
  const supplierSubtotal = new Prisma.Decimal(input.hourlyPriceUsd)
    .times(input.quantity)
    .times(hours)
    .toDecimalPlaces(2);
  const platformFee = supplierSubtotal
    .times(marginBps)
    .dividedBy(10_000)
    .toDecimalPlaces(2);
  const totalEstimatedCost = supplierSubtotal.plus(platformFee);

  return {
    billableHours: hours,
    supplierSubtotalUsd: supplierSubtotal.toFixed(2),
    marginBps,
    platformFeeUsd: platformFee.toFixed(2),
    totalEstimatedCostUsd: totalEstimatedCost.toFixed(2),
  };
}

export function isWithinBudget(
  totalEstimatedCostUsd: string,
  budgetMaxUsd: string,
): boolean {
  return compareDecimalStrings(totalEstimatedCostUsd, budgetMaxUsd) <= 0;
}

export function quoteExpiresAt(from: Date, days = QUOTE_EXPIRY_DAYS): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}
