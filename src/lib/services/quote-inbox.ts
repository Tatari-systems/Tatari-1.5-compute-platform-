import type { Prisma } from "@/generated/prisma/client";

import { getPrisma } from "@/lib/db/client";
import { formatRequirementReference } from "@/lib/requirements/reference";

const LIST_TAKE = 50;

export type QuoteInboxItem = {
  requirementId: string;
  reference: string;
  companyName: string;
  contactName: string;
  gpuModel: string;
  quantity: number;
  region: string;
  createdAt: string;
  quote: {
    id: string;
    status: string;
    totalEstimatedCostUsd: string;
    expiresAt: string;
  } | null;
};

export type QuoteInbox = {
  pending: QuoteInboxItem[];
  decided: QuoteInboxItem[];
  noMatch: QuoteInboxItem[];
};

type InboxStore = {
  quote: {
    findMany: (args: unknown) => Promise<
      Array<{
        id: string;
        status: string;
        totalEstimatedCostUsd: Prisma.Decimal | string;
        expiresAt: Date;
        createdAt: Date;
        requirement: {
          id: string;
          contactName: string;
          companyName: string;
          gpuModel: string;
          quantity: number;
          region: string;
          createdAt: Date;
        };
      }>
    >;
  };
  clientRequirement: {
    findMany: (args: unknown) => Promise<
      Array<{
        id: string;
        contactName: string;
        companyName: string;
        gpuModel: string;
        quantity: number;
        region: string;
        createdAt: Date;
      }>
    >;
  };
};

function decimalToUsd(value: Prisma.Decimal | string): string {
  return typeof value === "string" ? value : value.toFixed(2);
}

function toQuoteItem(row: {
  id: string;
  status: string;
  totalEstimatedCostUsd: Prisma.Decimal | string;
  expiresAt: Date;
  requirement: {
    id: string;
    contactName: string;
    companyName: string;
    gpuModel: string;
    quantity: number;
    region: string;
    createdAt: Date;
  };
}): QuoteInboxItem {
  return {
    requirementId: row.requirement.id,
    reference: formatRequirementReference(row.requirement.id),
    companyName: row.requirement.companyName,
    contactName: row.requirement.contactName,
    gpuModel: row.requirement.gpuModel,
    quantity: row.requirement.quantity,
    region: row.requirement.region,
    createdAt: row.requirement.createdAt.toISOString(),
    quote: {
      id: row.id,
      status: row.status,
      totalEstimatedCostUsd: decimalToUsd(row.totalEstimatedCostUsd),
      expiresAt: row.expiresAt.toISOString(),
    },
  };
}

export async function listQuoteInbox(
  deps: { prisma?: InboxStore } = {},
): Promise<QuoteInbox> {
  const prisma = deps.prisma ?? (getPrisma() as unknown as InboxStore);

  const [quotes, unmatched] = await Promise.all([
    prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      take: LIST_TAKE,
      select: {
        id: true,
        status: true,
        totalEstimatedCostUsd: true,
        expiresAt: true,
        createdAt: true,
        requirement: {
          select: {
            id: true,
            contactName: true,
            companyName: true,
            gpuModel: true,
            quantity: true,
            region: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.clientRequirement.findMany({
      where: { status: "no_match" },
      orderBy: { createdAt: "desc" },
      take: LIST_TAKE,
      select: {
        id: true,
        contactName: true,
        companyName: true,
        gpuModel: true,
        quantity: true,
        region: true,
        createdAt: true,
      },
    }),
  ]);

  const pending: QuoteInboxItem[] = [];
  const decided: QuoteInboxItem[] = [];

  for (const quote of quotes) {
    const item = toQuoteItem(quote);
    if (quote.status === "pending_approval") {
      pending.push(item);
    } else {
      decided.push(item);
    }
  }

  return {
    pending,
    decided,
    noMatch: unmatched.map((requirement) => ({
      requirementId: requirement.id,
      reference: formatRequirementReference(requirement.id),
      companyName: requirement.companyName,
      contactName: requirement.contactName,
      gpuModel: requirement.gpuModel,
      quantity: requirement.quantity,
      region: requirement.region,
      createdAt: requirement.createdAt.toISOString(),
      quote: null,
    })),
  };
}
