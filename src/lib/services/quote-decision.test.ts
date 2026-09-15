import { describe, expect, it, vi } from "vitest";

import { decideQuote } from "@/lib/services/quote-decision";

const quoteId = "22222222-2222-4222-8222-222222222222";
const requirementId = "11111111-1111-4111-8111-111111111111";
const commitmentId = "33333333-3333-4333-8333-333333333333";
const approver = { id: "actor-approver", role: "approver" };

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

function createWriter(options?: {
  status?: string;
  missing?: boolean;
  existingCommitmentId?: string;
}) {
  const quotes: unknown[] = [];
  const commitments: Array<{ id: string; quoteId: string }> = [];
  const audits: unknown[] = [];

  const quote = options?.missing
    ? null
    : {
        id: quoteId,
        status: options?.status ?? "pending_approval",
        requirementId,
        commitment: options?.existingCommitmentId
          ? { id: options.existingCommitmentId }
          : null,
      };

  const prisma = {
    quote: {
      findUnique: vi.fn(async () => quote),
      update: vi.fn((args: { data: { status: string } }) =>
        lazy(async () => {
          if (!quote) {
            throw new Error("quote missing");
          }
          quote.status = args.data.status;
          quotes.push(args.data);
          return {
            id: quote.id,
            status: quote.status,
            requirementId: quote.requirementId,
          };
        }),
      ),
    },
    commitment: {
      create: vi.fn(
        (args: { data: { id?: string; quote: { connect: { id: string } } } }) =>
          lazy(async () => {
            if (commitments.length > 0 || quote?.commitment) {
              const error = new Error("Unique constraint failed") as Error & {
                code: string;
              };
              error.code = "P2002";
              throw error;
            }
            const id = args.data.id ?? commitmentId;
            commitments.push({ id, quoteId: args.data.quote.connect.id });
            if (quote) {
              quote.commitment = { id };
            }
            return { id };
          }),
      ),
    },
    auditLog: {
      create: vi.fn(({ data }: { data: unknown }) =>
        lazy(async () => {
          audits.push(data);
          return { id: `audit-${audits.length}` };
        }),
      ),
    },
    $transaction: vi.fn(async (operations: Array<PromiseLike<unknown>>) => {
      const quoteSnapshot = quote ? { ...quote } : null;
      const commitmentSnapshot = commitments.length;
      const auditSnapshot = audits.length;

      try {
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      } catch (error) {
        if (quote && quoteSnapshot) {
          quote.status = quoteSnapshot.status;
          quote.commitment = quoteSnapshot.commitment;
        }
        commitments.splice(commitmentSnapshot);
        audits.splice(auditSnapshot);
        throw error;
      }
    }),
  };

  return { prisma, quote, quotes, commitments, audits };
}

describe("decideQuote", () => {
  it("approves a pending quote and creates one commitment with actor audits", async () => {
    const { prisma, commitments, audits } = createWriter();

    const result = await decideQuote(
      { quoteId, decision: "approve" },
      approver,
      { prisma: prisma as never, commitmentId },
    );

    expect(result).toEqual({
      ok: true,
      quoteId,
      requirementId,
      status: "approved",
      commitmentId,
    });
    expect(commitments).toHaveLength(1);
    expect(audits).toEqual([
      expect.objectContaining({
        entityType: "quote",
        action: "status_changed",
        beforeStatus: "pending_approval",
        afterStatus: "approved",
        actorId: approver.id,
      }),
      expect.objectContaining({
        entityType: "commitment",
        action: "created",
        beforeStatus: null,
        afterStatus: "pending_delivery",
        actorId: approver.id,
      }),
    ]);
  });

  it("rejects a pending quote with a reason and does not create a commitment", async () => {
    const { prisma, commitments, audits } = createWriter();

    const result = await decideQuote(
      { quoteId, decision: "reject", reason: "Dates do not work." },
      approver,
      { prisma: prisma as never },
    );

    expect(result).toEqual({
      ok: true,
      quoteId,
      requirementId,
      status: "rejected",
    });
    expect(commitments).toHaveLength(0);
    expect(audits).toEqual([
      expect.objectContaining({
        afterStatus: "rejected",
        actorId: approver.id,
        metadata: { reason: "Dates do not work." },
      }),
    ]);
  });

  it("requires a rejection reason before touching the database", async () => {
    const { prisma } = createWriter();

    const result = await decideQuote(
      { quoteId, decision: "reject", reason: "  " },
      approver,
      { prisma: prisma as never },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("validation");
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("denies reviewers and missing actors without writing", async () => {
    const { prisma } = createWriter();

    await expect(
      decideQuote(
        { quoteId, decision: "approve" },
        { id: "", role: "admin" },
        {
          prisma: prisma as never,
        },
      ),
    ).resolves.toMatchObject({ ok: false, error: "forbidden" });

    await expect(
      decideQuote(
        { quoteId, decision: "approve" },
        { id: "actor-reviewer", role: "reviewer" },
        { prisma: prisma as never },
      ),
    ).resolves.toMatchObject({ ok: false, error: "forbidden" });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not create a second commitment when the quote is already decided", async () => {
    const first = createWriter();
    await decideQuote({ quoteId, decision: "approve" }, approver, {
      prisma: first.prisma as never,
      commitmentId,
    });

    const second = await decideQuote(
      { quoteId, decision: "approve" },
      approver,
      { prisma: first.prisma as never, commitmentId: "duplicate" },
    );

    expect(second).toMatchObject({ ok: false, error: "conflict" });
    expect(first.commitments).toHaveLength(1);
  });
});
