import { Prisma } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

import { proposeQuoteForRequirement } from "@/lib/matching/proposeQuote";
import { seedGpuSupplies } from "../../../prisma/seed-data";
import { validRequirementInput } from "@/test/fixtures/marketplace";

const requirementId = "11111111-1111-4111-8111-111111111111";
const quoteId = "22222222-2222-4222-8222-222222222222";
const now = new Date("2026-09-14T12:00:00.000Z");

function lazy<T>(run: () => Promise<T>) {
  return {
    then(
      onFulfilled?: (value: T) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      return run().then(onFulfilled, onRejected);
    },
  };
}

function supplyRows() {
  return seedGpuSupplies.map((supply) => ({
    ...supply,
    hourlyPriceUsd: new Prisma.Decimal(supply.hourlyPriceUsd),
    availableFrom: new Date(supply.availableFrom),
    availableUntil: new Date(supply.availableUntil),
    lastVerifiedAt: supply.lastVerifiedAt
      ? new Date(supply.lastVerifiedAt)
      : null,
    sourceReference: supply.sourceReference ?? null,
    metadata: supply.metadata ?? null,
  }));
}

function createWriter(options?: {
  status?: string;
  existingQuoteId?: string;
  supplies?: ReturnType<typeof supplyRows>;
  region?: string;
}) {
  const updates: unknown[] = [];
  const quotes: unknown[] = [];
  const audits: unknown[] = [];

  const requirement = {
    id: requirementId,
    status: options?.status ?? "submitted",
    gpuModel: validRequirementInput.gpuModel,
    quantity: validRequirementInput.quantity,
    region: options?.region ?? validRequirementInput.region,
    timeframeStart: new Date(validRequirementInput.timeframeStart),
    timeframeEnd: new Date(validRequirementInput.timeframeEnd),
    budgetMaxUsd: new Prisma.Decimal(validRequirementInput.budgetMaxUsd),
    minimumUptimeBps: validRequirementInput.minimumUptimeBps,
    mustHaves: validRequirementInput.mustHaves,
    niceToHaves: validRequirementInput.niceToHaves,
    quote: options?.existingQuoteId ? { id: options.existingQuoteId } : null,
  };

  const prisma = {
    clientRequirement: {
      findUnique: vi.fn(async () => requirement),
      update: vi.fn((args: { data: { status: string } }) =>
        lazy(async () => {
          updates.push(args.data.status);
          requirement.status = args.data.status;
          return requirement;
        }),
      ),
    },
    gpuSupply: {
      findMany: vi.fn(async () => options?.supplies ?? supplyRows()),
    },
    quote: {
      create: vi.fn((args: { data: { id: string } }) =>
        lazy(async () => {
          quotes.push(args.data);
          return { id: args.data.id };
        }),
      ),
    },
    auditLog: {
      create: vi.fn((args: { data: unknown }) =>
        lazy(async () => {
          audits.push(args.data);
          return { id: "audit" };
        }),
      ),
    },
    $transaction: vi.fn(async (operations: Array<PromiseLike<unknown>>) => {
      const results = [];
      for (const operation of operations) {
        results.push(await operation);
      }
      return results;
    }),
  };

  return { prisma, updates, quotes, audits };
}

describe("proposeQuoteForRequirement", () => {
  it("creates one pending quote from the best match", async () => {
    const { prisma, updates, quotes, audits } = createWriter();

    const result = await proposeQuoteForRequirement(requirementId, {
      prisma: prisma as never,
      quoteId,
      now,
    });

    expect(result).toEqual({
      ok: true,
      outcome: "matched",
      quoteId,
      requirementId,
    });
    expect(updates).toEqual(["matched"]);
    expect(quotes).toHaveLength(1);
    expect(audits).toHaveLength(2);
    expect(quotes[0]).toMatchObject({
      id: quoteId,
      status: "pending_approval",
    });
  });

  it("records no_match and does not create a quote", async () => {
    const { prisma, updates, quotes } = createWriter({ region: "ap-south" });

    const result = await proposeQuoteForRequirement(requirementId, {
      prisma: prisma as never,
    });

    expect(result).toEqual({
      ok: true,
      outcome: "no_match",
      requirementId,
    });
    expect(updates).toEqual(["no_match"]);
    expect(quotes).toHaveLength(0);
  });

  it("does not create a second quote when one already exists", async () => {
    const { prisma, quotes } = createWriter({
      status: "matched",
      existingQuoteId: quoteId,
    });

    const result = await proposeQuoteForRequirement(requirementId, {
      prisma: prisma as never,
    });

    expect(result).toEqual({
      ok: true,
      outcome: "matched",
      quoteId,
      requirementId,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(quotes).toHaveLength(0);
  });
});
