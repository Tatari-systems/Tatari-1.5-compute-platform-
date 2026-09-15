import { describe, expect, it } from "vitest";

import { billableHoursUtc, priceQuote } from "@/lib/matching/pricing";

describe("quote pricing", () => {
  it("rounds duration up to whole UTC hours and applies explicit margin", () => {
    const price = priceQuote({
      hourlyPriceUsd: "2.750000",
      quantity: 8,
      timeframeStart: new Date("2026-10-01T00:00:00.000Z"),
      timeframeEnd: new Date("2026-10-15T00:00:00.000Z"),
      marginBps: 1000,
    });

    expect(price.billableHours).toBe(336);
    expect(price.supplierSubtotalUsd).toBe("7392.00");
    expect(price.platformFeeUsd).toBe("739.20");
    expect(price.totalEstimatedCostUsd).toBe("8131.20");
  });

  it("never bills less than one hour", () => {
    expect(
      billableHoursUtc(
        new Date("2026-10-01T00:00:00.000Z"),
        new Date("2026-10-01T00:00:00.000Z"),
      ),
    ).toBe(1);
    expect(
      billableHoursUtc(
        new Date("2026-10-01T00:00:00.000Z"),
        new Date("2026-10-01T00:10:00.000Z"),
      ),
    ).toBe(1);
  });
});
