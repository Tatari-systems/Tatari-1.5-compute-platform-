import { describe, expect, it } from "vitest";

import {
  ClientRequirementSchema,
  CommitmentStatusSchema,
  CreateQuoteCommandSchema,
  GpuSupplySchema,
  QuoteDecisionCommandSchema,
  RequirementStatusSchema,
  compareDecimalStrings,
} from "@/lib/validation";
import {
  validQuoteInput,
  validRequirementInput,
  validSupplyInput,
} from "@/test/fixtures/marketplace";

describe("ClientRequirementSchema", () => {
  it("accepts a valid requirement and converts timestamps to Date values", () => {
    const result = ClientRequirementSchema.parse(validRequirementInput);

    expect(result.timeframeStart).toBeInstanceOf(Date);
    expect(result.timeframeEnd).toBeInstanceOf(Date);
    expect(result.quantity).toBe(8);
  });

  it("accepts explicit timezone offsets", () => {
    const result = ClientRequirementSchema.parse({
      ...validRequirementInput,
      timeframeStart: "2026-10-01T03:00:00+03:00",
    });

    expect(result.timeframeStart.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("rejects an inverted budget with a field-level error", () => {
    const result = ClientRequirementSchema.safeParse({
      ...validRequirementInput,
      budgetMinUsd: "30000.01",
      budgetMaxUsd: "30000.00",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["budgetMinUsd"] }),
        ]),
      );
    }
  });

  it("rejects a timeframe whose end is not after its start", () => {
    const result = ClientRequirementSchema.safeParse({
      ...validRequirementInput,
      timeframeEnd: validRequirementInput.timeframeStart,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["timeframeEnd"] }),
        ]),
      );
    }
  });

  it.each([0, -1, 1.5])("rejects invalid quantity %s", (quantity) => {
    expect(
      ClientRequirementSchema.safeParse({
        ...validRequirementInput,
        quantity,
      }).success,
    ).toBe(false);
  });

  it.each([0, 10_001])(
    "rejects uptime outside the supported range: %s",
    (minimumUptimeBps) => {
      expect(
        ClientRequirementSchema.safeParse({
          ...validRequirementInput,
          minimumUptimeBps,
        }).success,
      ).toBe(false);
    },
  );

  it("rejects a criterion used as both a must-have and nice-to-have", () => {
    const result = ClientRequirementSchema.safeParse({
      ...validRequirementInput,
      niceToHaves: [{ key: "minimum_vram_gb", value: "preferred" }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["niceToHaves"] }),
        ]),
      );
    }
  });

  it("rejects unknown input fields", () => {
    expect(
      ClientRequirementSchema.safeParse({
        ...validRequirementInput,
        trustedByClient: true,
      }).success,
    ).toBe(false);
  });
});

describe("GpuSupplySchema", () => {
  it("accepts normalized seeded supply", () => {
    const result = GpuSupplySchema.parse(validSupplyInput);

    expect(result.isTestData).toBe(true);
    expect(result.availableFrom).toBeInstanceOf(Date);
  });

  it("rejects an invalid availability window", () => {
    expect(
      GpuSupplySchema.safeParse({
        ...validSupplyInput,
        availableUntil: validSupplyInput.availableFrom,
      }).success,
    ).toBe(false);
  });

  it("rejects zero-priced supply", () => {
    expect(
      GpuSupplySchema.safeParse({
        ...validSupplyInput,
        hourlyPriceUsd: "0",
      }).success,
    ).toBe(false);
  });
});

describe("quote commands", () => {
  it("accepts a quote with immutable line-item inputs", () => {
    const result = CreateQuoteCommandSchema.parse(validQuoteInput);

    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.lineItems).toHaveLength(1);
  });

  it("requires at least one quote line item", () => {
    expect(
      CreateQuoteCommandSchema.safeParse({
        ...validQuoteInput,
        lineItems: [],
      }).success,
    ).toBe(false);
  });

  it("accepts approval without accepting a client-provided actor", () => {
    expect(
      QuoteDecisionCommandSchema.parse({
        quoteId: "quote_01",
        decision: "approve",
      }),
    ).toEqual({ quoteId: "quote_01", decision: "approve" });

    expect(
      QuoteDecisionCommandSchema.safeParse({
        quoteId: "quote_01",
        decision: "approve",
        actorId: "untrusted-user",
      }).success,
    ).toBe(false);
  });

  it("requires a reason when rejecting", () => {
    expect(
      QuoteDecisionCommandSchema.safeParse({
        quoteId: "quote_01",
        decision: "reject",
        reason: "",
      }).success,
    ).toBe(false);
  });
});

describe("money and status boundaries", () => {
  it("compares decimal strings without floating-point arithmetic", () => {
    expect(compareDecimalStrings("1000000000000000000.01", "1000000000000000000.00")).toBe(1);
    expect(compareDecimalStrings("2.5", "2.500000")).toBe(0);
    expect(compareDecimalStrings("0.99", "1")).toBe(-1);
  });

  it("accepts only approved lifecycle status values", () => {
    expect(RequirementStatusSchema.parse("submitted")).toBe("submitted");
    expect(CommitmentStatusSchema.parse("pending_delivery")).toBe(
      "pending_delivery",
    );
    expect(RequirementStatusSchema.safeParse("created").success).toBe(false);
    expect(CommitmentStatusSchema.safeParse("provisioning").success).toBe(
      false,
    );
  });
});
