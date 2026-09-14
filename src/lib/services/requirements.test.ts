import { Prisma } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

import { submitClientRequirement } from "@/lib/services/requirements";
import { validRequirementInput } from "@/test/fixtures/marketplace";

const createdId = "11111111-1111-4111-8111-111111111111";
const createdAt = new Date("2026-09-14T10:00:00.000Z");

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

function createWriter(options?: { failAudit?: boolean }) {
  const requirements: unknown[] = [];
  const audits: unknown[] = [];
  const quotes: unknown[] = [];
  const commitments: unknown[] = [];

  const prisma = {
    clientRequirement: {
      create: vi.fn(({ data }: { data: Record<string, unknown> }) =>
        lazy(async () => {
          const record = {
            id: data.id ?? createdId,
            createdAt,
            companyName: data.companyName,
            gpuModel: data.gpuModel,
            quantity: data.quantity,
            region: data.region,
            timeframeStart: data.timeframeStart,
            timeframeEnd: data.timeframeEnd,
            budgetMaxUsd: data.budgetMaxUsd,
            workloadType: data.workloadType,
            status: data.status,
          };
          requirements.push(record);
          return record;
        }),
      ),
    },
    auditLog: {
      create: vi.fn(({ data }: { data: unknown }) =>
        lazy(async () => {
          if (options?.failAudit) {
            throw new Error("audit write failed");
          }
          audits.push(data);
          return { id: "audit-1" };
        }),
      ),
    },
    quote: {
      create: vi.fn(async () => {
        quotes.push({});
        throw new Error("quote.create must not run during requirement intake");
      }),
    },
    commitment: {
      create: vi.fn(async () => {
        commitments.push({});
        throw new Error(
          "commitment.create must not run during requirement intake",
        );
      }),
    },
    $transaction: vi.fn(async (operations: Array<PromiseLike<unknown>>) => {
      const requirementSnapshot = requirements.length;
      const auditSnapshot = audits.length;

      try {
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      } catch (error) {
        requirements.splice(requirementSnapshot);
        audits.splice(auditSnapshot);
        throw error;
      }
    }),
  };

  return { prisma, requirements, audits, quotes, commitments };
}

describe("submitClientRequirement", () => {
  it("creates a submitted requirement and matching audit row together", async () => {
    const { prisma, requirements, audits, quotes, commitments } =
      createWriter();

    const result = await submitClientRequirement(validRequirementInput, {
      prisma: prisma as never,
      id: createdId,
    });

    expect(result).toEqual({
      ok: true,
      confirmation: {
        id: createdId,
        reference: "REQ-11111111",
        createdAt: createdAt.toISOString(),
        summary: {
          companyName: validRequirementInput.companyName,
          gpuModel: validRequirementInput.gpuModel,
          quantity: 8,
          region: "eu-west",
          timeframeStart: "2026-10-01T00:00:00.000Z",
          timeframeEnd: "2026-10-15T00:00:00.000Z",
          budgetMaxUsd: "30000.00",
          workloadType: "ai_training",
        },
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(requirements).toHaveLength(1);
    expect(audits).toHaveLength(1);
    expect(quotes).toHaveLength(0);
    expect(commitments).toHaveLength(0);
    expect(requirements[0]).toMatchObject({
      id: createdId,
      status: "submitted",
      budgetMaxUsd: new Prisma.Decimal("30000.00"),
    });
    expect(audits[0]).toMatchObject({
      entityType: "client_requirement",
      entityId: createdId,
      action: "created",
      beforeStatus: null,
      afterStatus: "submitted",
      metadata: { source: "public_form" },
    });
  });

  it("rejects an invalid payload before touching the database", async () => {
    const { prisma } = createWriter();

    const result = await submitClientRequirement(
      {
        ...validRequirementInput,
        budgetMinUsd: "40000.00",
        budgetMaxUsd: "30000.00",
      },
      { prisma: prisma as never },
    );

    expect(result.ok).toBe(false);
    if (!result.ok && result.error === "validation") {
      expect(result.fieldErrors.budgetMinUsd).toEqual([
        "Minimum budget cannot exceed maximum budget",
      ]);
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects spoofed statuses and extra fields without writing", async () => {
    const { prisma } = createWriter();

    const result = await submitClientRequirement(
      {
        ...validRequirementInput,
        status: "matched",
      },
      { prisma: prisma as never },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("validation");
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not keep a requirement if the audit write fails", async () => {
    const { prisma, requirements, audits } = createWriter({ failAudit: true });

    const result = await submitClientRequirement(validRequirementInput, {
      prisma: prisma as never,
      id: createdId,
    });

    expect(result).toEqual({
      ok: false,
      error: "server",
      formError: "We could not save this request. Try again.",
    });
    expect(requirements).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });
});
