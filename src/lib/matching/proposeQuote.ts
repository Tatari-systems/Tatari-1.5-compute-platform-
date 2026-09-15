import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { z } from "zod";

import { getDirectPrisma, getPrisma } from "@/lib/db/client";
import { buildAuditLogCreate, mapQuoteCreate } from "@/lib/db/mappers";
import { canTransitionRequirement } from "@/lib/domain/statuses";
import { matchSupply, type RankedMatch } from "@/lib/matching/matchSupply";
import { quoteExpiresAt } from "@/lib/matching/pricing";
import { toMatchableSupply } from "@/lib/matching/supply";
import { formatRequirementReference } from "@/lib/requirements/reference";
import {
  RequirementCriterionSchema,
  type RequirementCriterion,
} from "@/lib/validation";

export type ProposeQuoteOutcome =
  | { ok: true; outcome: "matched"; quoteId: string; requirementId: string }
  | { ok: true; outcome: "no_match"; requirementId: string }
  | { ok: true; outcome: "skipped"; requirementId: string; status: string }
  | { ok: false; error: "not_found" | "server"; formError: string };

const criteriaSchema = z.array(RequirementCriterionSchema);

function parseCriteria(value: Prisma.JsonValue): RequirementCriterion[] {
  const parsed = criteriaSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

function decimalToUsd(value: Prisma.Decimal | string): string {
  return typeof value === "string" ? value : value.toFixed(2);
}

type QuoteWriter = {
  clientRequirement: {
    findUnique: (args: unknown) => Promise<{
      id: string;
      status: string;
      gpuModel: string;
      quantity: number;
      region: string;
      timeframeStart: Date;
      timeframeEnd: Date;
      budgetMaxUsd: Prisma.Decimal;
      minimumUptimeBps: number;
      mustHaves: Prisma.JsonValue;
      niceToHaves: Prisma.JsonValue;
      quote: { id: string } | null;
    } | null>;
    update: (args: unknown) => Promise<unknown>;
  };
  gpuSupply: {
    findMany: (
      args?: unknown,
    ) => Promise<Array<Parameters<typeof toMatchableSupply>[0]>>;
  };
  quote: {
    create: (args: unknown) => Promise<{ id: string }>;
  };
  auditLog: {
    create: (args: unknown) => Promise<unknown>;
  };
  $transaction: <T>(
    operations: readonly T[],
    options?: { maxWait?: number; timeout?: number },
  ) => Promise<T[]>;
};

export async function proposeQuoteForRequirement(
  requirementId: string,
  deps: { prisma?: QuoteWriter; now?: Date; quoteId?: string } = {},
): Promise<ProposeQuoteOutcome> {
  const prisma: QuoteWriter =
    deps.prisma ?? (getDirectPrisma() as unknown as QuoteWriter);

  try {
    const requirement = await prisma.clientRequirement.findUnique({
      where: { id: requirementId },
      select: {
        id: true,
        status: true,
        gpuModel: true,
        quantity: true,
        region: true,
        timeframeStart: true,
        timeframeEnd: true,
        budgetMaxUsd: true,
        minimumUptimeBps: true,
        mustHaves: true,
        niceToHaves: true,
        quote: { select: { id: true } },
      },
    });

    if (!requirement) {
      return {
        ok: false,
        error: "not_found",
        formError: "That request was not found.",
      };
    }

    if (requirement.quote) {
      return {
        ok: true,
        outcome: "matched",
        quoteId: requirement.quote.id,
        requirementId,
      };
    }

    if (requirement.status !== "submitted") {
      if (requirement.status === "no_match") {
        return { ok: true, outcome: "no_match", requirementId };
      }

      return {
        ok: true,
        outcome: "skipped",
        requirementId,
        status: requirement.status,
      };
    }

    const supplyRows = await prisma.gpuSupply.findMany();
    const matches = matchSupply(
      {
        gpuModel: requirement.gpuModel,
        quantity: requirement.quantity,
        region: requirement.region,
        timeframeStart: requirement.timeframeStart,
        timeframeEnd: requirement.timeframeEnd,
        budgetMaxUsd: decimalToUsd(requirement.budgetMaxUsd),
        minimumUptimeBps: requirement.minimumUptimeBps,
        mustHaves: parseCriteria(requirement.mustHaves),
        niceToHaves: parseCriteria(requirement.niceToHaves),
      },
      supplyRows
        .map((row) => toMatchableSupply(row))
        .filter(
          (supply): supply is NonNullable<typeof supply> => supply !== null,
        ),
    );

    if (matches.length === 0) {
      if (!canTransitionRequirement("submitted", "no_match")) {
        return {
          ok: true,
          outcome: "skipped",
          requirementId,
          status: requirement.status,
        };
      }

      await prisma.$transaction(
        [
          prisma.clientRequirement.update({
            where: { id: requirementId },
            data: { status: "no_match" },
          }),
          prisma.auditLog.create({
            data: buildAuditLogCreate({
              entityType: "client_requirement",
              entityId: requirementId,
              action: "status_changed",
              beforeStatus: "submitted",
              afterStatus: "no_match",
            }),
          }),
        ],
        { maxWait: 15_000, timeout: 20_000 },
      );

      return { ok: true, outcome: "no_match", requirementId };
    }

    const quoteId = deps.quoteId ?? randomUUID();
    const best = matches[0];
    if (!best) {
      return { ok: true, outcome: "no_match", requirementId };
    }

    const now = deps.now ?? new Date();
    const quoteInput = mapQuoteCreate({
      requirementId,
      expiresAt: quoteExpiresAt(now).toISOString(),
      lineItems: [toLineItem(best, requirement.quantity)],
    });

    await prisma.$transaction(
      [
        prisma.clientRequirement.update({
          where: { id: requirementId },
          data: { status: "matched" },
        }),
        prisma.quote.create({
          data: { id: quoteId, ...quoteInput },
        }),
        prisma.auditLog.create({
          data: buildAuditLogCreate({
            entityType: "client_requirement",
            entityId: requirementId,
            action: "status_changed",
            beforeStatus: "submitted",
            afterStatus: "matched",
          }),
        }),
        prisma.auditLog.create({
          data: buildAuditLogCreate({
            entityType: "quote",
            entityId: quoteId,
            action: "created",
            beforeStatus: null,
            afterStatus: "pending_approval",
            metadata: { candidateCount: matches.length },
          }),
        }),
      ],
      { maxWait: 15_000, timeout: 20_000 },
    );

    return { ok: true, outcome: "matched", quoteId, requirementId };
  } catch (error) {
    console.error("Failed to propose a quote", error);
    return {
      ok: false,
      error: "server",
      formError: "The request was saved, but matching could not be completed.",
    };
  }
}

function toLineItem(match: RankedMatch, quantity: number) {
  return {
    supplyId: match.supply.id,
    vendorId: match.supply.vendorId,
    gpuModel: match.supply.gpuModel,
    region: match.supply.region,
    quantity,
    hourlyPriceUsd: match.supply.hourlyPriceUsd,
    billableHours: match.price.billableHours,
    supplierSubtotalUsd: match.price.supplierSubtotalUsd,
    marginBps: match.price.marginBps,
    platformFeeUsd: match.price.platformFeeUsd,
    totalEstimatedCostUsd: match.price.totalEstimatedCostUsd,
    minimumUptimeBps: match.supply.minimumUptimeBps,
  };
}

export type QuoteReview = {
  requirement: {
    id: string;
    reference: string;
    status: string;
    contactName: string;
    companyName: string;
    gpuModel: string;
    quantity: number;
    region: string;
    timeframeStart: string;
    timeframeEnd: string;
    budgetMaxUsd: string;
    minimumUptimeBps: number;
    mustHaves: RequirementCriterion[];
    niceToHaves: RequirementCriterion[];
  };
  quote: {
    id: string;
    status: string;
    totalEstimatedCostUsd: string;
    expiresAt: string;
    commitment: { id: string; status: string } | null;
    lineItems: Array<{
      gpuModel: string;
      region: string;
      quantity: number;
      hourlyPriceUsd: string;
      billableHours: number;
      marginBps: number;
      platformFeeUsd: string;
      supplierSubtotalUsd: string;
      totalEstimatedCostUsd: string;
      minimumUptimeBps: number;
      vendorId: string;
    }>;
  } | null;
  matches: Array<{
    supplyId: string;
    gpuModel: string;
    region: string;
    vendorId: string;
    score: number;
    totalEstimatedCostUsd: string;
    selected: boolean;
  }>;
};

export async function getQuoteReview(
  requirementId: string,
  deps: { prisma?: PrismaClient } = {},
): Promise<QuoteReview | null> {
  const prisma = deps.prisma ?? getPrisma();
  const requirement = await prisma.clientRequirement.findUnique({
    where: { id: requirementId },
    include: {
      quote: {
        include: {
          lineItems: { orderBy: { createdAt: "asc" } },
          commitment: { select: { id: true, status: true } },
        },
      },
    },
  });

  if (!requirement) {
    return null;
  }

  const supplyRows = await prisma.gpuSupply.findMany();
  const matches = matchSupply(
    {
      gpuModel: requirement.gpuModel,
      quantity: requirement.quantity,
      region: requirement.region,
      timeframeStart: requirement.timeframeStart,
      timeframeEnd: requirement.timeframeEnd,
      budgetMaxUsd: decimalToUsd(requirement.budgetMaxUsd),
      minimumUptimeBps: requirement.minimumUptimeBps,
      mustHaves: parseCriteria(requirement.mustHaves),
      niceToHaves: parseCriteria(requirement.niceToHaves),
    },
    supplyRows
      .map((row) => toMatchableSupply(row))
      .filter(
        (supply): supply is NonNullable<typeof supply> => supply !== null,
      ),
  );

  const selectedSupplyId = requirement.quote?.lineItems[0]?.supplyId ?? null;

  return {
    requirement: {
      id: requirement.id,
      reference: formatRequirementReference(requirement.id),
      status: requirement.status,
      contactName: requirement.contactName,
      companyName: requirement.companyName,
      gpuModel: requirement.gpuModel,
      quantity: requirement.quantity,
      region: requirement.region,
      timeframeStart: requirement.timeframeStart.toISOString(),
      timeframeEnd: requirement.timeframeEnd.toISOString(),
      budgetMaxUsd: decimalToUsd(requirement.budgetMaxUsd),
      minimumUptimeBps: requirement.minimumUptimeBps,
      mustHaves: parseCriteria(requirement.mustHaves),
      niceToHaves: parseCriteria(requirement.niceToHaves),
    },
    quote: requirement.quote
      ? {
          id: requirement.quote.id,
          status: requirement.quote.status,
          totalEstimatedCostUsd: decimalToUsd(
            requirement.quote.totalEstimatedCostUsd,
          ),
          expiresAt: requirement.quote.expiresAt.toISOString(),
          commitment: requirement.quote.commitment
            ? {
                id: requirement.quote.commitment.id,
                status: requirement.quote.commitment.status,
              }
            : null,
          lineItems: requirement.quote.lineItems.map((item) => ({
            gpuModel: item.gpuModel,
            region: item.region,
            quantity: item.quantity,
            hourlyPriceUsd:
              typeof item.hourlyPriceUsd === "string"
                ? item.hourlyPriceUsd
                : item.hourlyPriceUsd.toFixed(6),
            billableHours: item.billableHours,
            marginBps: item.marginBps,
            platformFeeUsd: decimalToUsd(item.platformFeeUsd),
            supplierSubtotalUsd: decimalToUsd(item.supplierSubtotalUsd),
            totalEstimatedCostUsd: decimalToUsd(item.totalEstimatedCostUsd),
            minimumUptimeBps: item.minimumUptimeBps,
            vendorId: item.vendorId,
          })),
        }
      : null,
    matches: matches.map((match) => ({
      supplyId: match.supply.id,
      gpuModel: match.supply.gpuModel,
      region: match.supply.region,
      vendorId: match.supply.vendorId,
      score: match.score,
      totalEstimatedCostUsd: match.price.totalEstimatedCostUsd,
      selected: match.supply.id === selectedSupplyId,
    })),
  };
}
