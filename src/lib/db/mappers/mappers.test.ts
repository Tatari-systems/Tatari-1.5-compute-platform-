import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { Prisma } from "@/generated/prisma/client";
import {
  validQuoteInput,
  validRequirementInput,
  validSupplyInput,
} from "@/test/fixtures/marketplace";

import {
  buildAuditLogCreate,
  buildCommitmentCreate,
  mapClientRequirementCreate,
  mapGpuSupplyCreate,
  mapQuoteCreate,
} from ".";

describe("database boundary mappers", () => {
  it("validates and maps a public requirement without accepting its status", () => {
    const mapped = mapClientRequirementCreate(validRequirementInput);

    expect(mapped.status).toBe("submitted");
    expect(mapped.timeframeStart).toEqual(
      new Date(validRequirementInput.timeframeStart),
    );
    expect(mapped.budgetMinUsd).toEqual(
      new Prisma.Decimal(validRequirementInput.budgetMinUsd),
    );
    expect(() =>
      mapClientRequirementCreate({
        ...validRequirementInput,
        status: "matched",
      }),
    ).toThrow(ZodError);
  });

  it("rejects an invalid requirement before producing database input", () => {
    expect(() =>
      mapClientRequirementCreate({
        ...validRequirementInput,
        budgetMinUsd: "40000.00",
        budgetMaxUsd: "30000.00",
      }),
    ).toThrow(ZodError);
  });

  it("maps validated supply values to dates, decimals, and JSON", () => {
    const mapped = mapGpuSupplyCreate(validSupplyInput);

    expect(mapped.hourlyPriceUsd).toEqual(new Prisma.Decimal("2.750000"));
    expect(mapped.availableFrom).toEqual(
      new Date(validSupplyInput.availableFrom),
    );
    expect(mapped.metadata).toEqual(validSupplyInput.metadata);
  });

  it("creates an immutable quote snapshot and calculates its total", () => {
    const mapped = mapQuoteCreate({
      ...validQuoteInput,
      lineItems: [
        ...validQuoteInput.lineItems,
        {
          ...validQuoteInput.lineItems[0],
          supplyId: "supply_eu_h100_02",
          totalEstimatedCostUsd: "100.00",
        },
      ],
    });

    expect(mapped.status).toBe("pending_approval");
    expect(mapped.totalEstimatedCostUsd).toEqual(new Prisma.Decimal("8231.20"));
    expect(mapped.requirement).toEqual({
      connect: { id: validQuoteInput.requirementId },
    });
    expect(mapped.lineItems).toMatchObject({
      create: [
        {
          supply: { connect: { id: validSupplyInput.id } },
          totalEstimatedCostUsd: new Prisma.Decimal("8131.20"),
        },
        {
          supply: { connect: { id: "supply_eu_h100_02" } },
          totalEstimatedCostUsd: new Prisma.Decimal("100.00"),
        },
      ],
    });
  });

  it("builds internal-only commitment and audit records", () => {
    expect(buildCommitmentCreate("quote_01")).toEqual({
      quote: { connect: { id: "quote_01" } },
      status: "pending_delivery",
    });

    expect(
      buildAuditLogCreate({
        entityType: "client_requirement",
        entityId: "requirement_01",
        action: "created",
        beforeStatus: null,
        afterStatus: "submitted",
      }),
    ).toEqual({
      entityType: "client_requirement",
      entityId: "requirement_01",
      action: "created",
      beforeStatus: null,
      afterStatus: "submitted",
      metadata: undefined,
      actor: undefined,
    });
  });
});
