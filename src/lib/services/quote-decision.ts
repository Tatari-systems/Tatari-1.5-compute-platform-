import { randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";

import { getDirectPrisma } from "@/lib/db/client";
import { buildAuditLogCreate, buildCommitmentCreate } from "@/lib/db/mappers";
import { canApprove } from "@/lib/domain/roles";
import { canTransitionQuote, type QuoteStatus } from "@/lib/domain/statuses";
import {
  fieldErrorsFromZod,
  type FieldErrorMap,
} from "@/lib/requirements/field-errors";
import { QuoteDecisionCommandSchema } from "@/lib/validation";

export type QuoteDecisionActor = {
  id: string;
  role: string;
};

export type DecideQuoteResult =
  | {
      ok: true;
      quoteId: string;
      requirementId: string;
      status: "approved" | "rejected";
      commitmentId?: string;
    }
  | {
      ok: false;
      error: "validation" | "forbidden" | "not_found" | "conflict" | "server";
      formError: string;
      fieldErrors?: FieldErrorMap;
    };

type QuoteRecord = {
  id: string;
  status: string;
  requirementId: string;
  commitment: { id: string } | null;
};

type QuoteDecisionWriter = {
  quote: {
    findUnique: (args: unknown) => Promise<QuoteRecord | null>;
    update: (args: unknown) => Promise<{
      id: string;
      status: string;
      requirementId: string;
    }>;
  };
  commitment: {
    create: (args: unknown) => Promise<{ id: string }>;
  };
  auditLog: {
    create: (args: {
      data: Prisma.AuditLogUncheckedCreateInput;
    }) => Promise<unknown>;
  };
  $transaction: <T>(
    operations: readonly T[],
    options?: { maxWait?: number; timeout?: number },
  ) => Promise<T[]>;
};

function isQuoteStatus(value: string): value is QuoteStatus {
  return (
    value === "pending_approval" || value === "approved" || value === "rejected"
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function decideQuote(
  input: unknown,
  actor: QuoteDecisionActor,
  deps: { prisma?: QuoteDecisionWriter; commitmentId?: string } = {},
): Promise<DecideQuoteResult> {
  if (!actor.id.trim()) {
    return {
      ok: false,
      error: "forbidden",
      formError: "A trusted internal actor is required.",
    };
  }

  if (!canApprove(actor.role)) {
    return {
      ok: false,
      error: "forbidden",
      formError: "Reviewers cannot approve or reject quotes.",
    };
  }

  const parsed = QuoteDecisionCommandSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      fieldErrors: fieldErrorsFromZod(parsed.error),
      formError: "Fix the highlighted fields and submit again.",
    };
  }

  const command = parsed.data;
  const prisma: QuoteDecisionWriter =
    deps.prisma ?? (getDirectPrisma() as unknown as QuoteDecisionWriter);

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: command.quoteId },
      select: {
        id: true,
        status: true,
        requirementId: true,
        commitment: { select: { id: true } },
      },
    });

    if (!quote) {
      return {
        ok: false,
        error: "not_found",
        formError: "That quote was not found.",
      };
    }

    if (!isQuoteStatus(quote.status) || quote.status !== "pending_approval") {
      return {
        ok: false,
        error: "conflict",
        formError:
          quote.status === "approved"
            ? "This quote is already approved."
            : quote.status === "rejected"
              ? "This quote is already rejected."
              : "This quote cannot be decided.",
      };
    }

    const nextStatus = command.decision === "approve" ? "approved" : "rejected";

    if (!canTransitionQuote(quote.status, nextStatus)) {
      return {
        ok: false,
        error: "conflict",
        formError: "This quote cannot be decided.",
      };
    }

    if (command.decision === "approve") {
      if (quote.commitment) {
        return {
          ok: false,
          error: "conflict",
          formError: "This quote is already approved.",
        };
      }

      const commitmentId = deps.commitmentId ?? randomUUID();

      await prisma.$transaction(
        [
          prisma.quote.update({
            where: { id: quote.id },
            data: { status: "approved" },
          }),
          prisma.commitment.create({
            data: {
              id: commitmentId,
              ...buildCommitmentCreate(quote.id),
            },
          }),
          prisma.auditLog.create({
            data: buildAuditLogCreate({
              entityType: "quote",
              entityId: quote.id,
              action: "status_changed",
              beforeStatus: "pending_approval",
              afterStatus: "approved",
              actorId: actor.id,
            }),
          }),
          prisma.auditLog.create({
            data: buildAuditLogCreate({
              entityType: "commitment",
              entityId: commitmentId,
              action: "created",
              beforeStatus: null,
              afterStatus: "pending_delivery",
              actorId: actor.id,
              metadata: { quoteId: quote.id },
            }),
          }),
        ],
        { maxWait: 15_000, timeout: 20_000 },
      );

      return {
        ok: true,
        quoteId: quote.id,
        requirementId: quote.requirementId,
        status: "approved",
        commitmentId,
      };
    }

    await prisma.$transaction(
      [
        prisma.quote.update({
          where: { id: quote.id },
          data: { status: "rejected" },
        }),
        prisma.auditLog.create({
          data: buildAuditLogCreate({
            entityType: "quote",
            entityId: quote.id,
            action: "status_changed",
            beforeStatus: "pending_approval",
            afterStatus: "rejected",
            actorId: actor.id,
            metadata: { reason: command.reason },
          }),
        }),
      ],
      { maxWait: 15_000, timeout: 20_000 },
    );

    return {
      ok: true,
      quoteId: quote.id,
      requirementId: quote.requirementId,
      status: "rejected",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        error: "conflict",
        formError: "This quote is already approved.",
      };
    }

    console.error("Failed to decide quote", error);
    return {
      ok: false,
      error: "server",
      formError: "We could not save this decision. Try again.",
    };
  }
}
