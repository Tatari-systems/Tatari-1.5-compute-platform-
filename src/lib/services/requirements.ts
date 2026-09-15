import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { getDirectPrisma, getPrisma } from "@/lib/db/client";
import {
  buildAuditLogCreate,
  mapClientRequirementCreate,
} from "@/lib/db/mappers";
import {
  fieldErrorsFromZod,
  type FieldErrorMap,
} from "@/lib/requirements/field-errors";
import { formatRequirementReference } from "@/lib/requirements/reference";
import { ClientRequirementSchema } from "@/lib/validation";

export type RequirementConfirmation = {
  id: string;
  reference: string;
  createdAt: string;
  summary: {
    companyName: string;
    gpuModel: string;
    quantity: number;
    region: string;
    timeframeStart: string;
    timeframeEnd: string;
    budgetMaxUsd: string;
    workloadType: string;
  };
};

export type SubmitRequirementResult =
  | { ok: true; confirmation: RequirementConfirmation }
  | {
      ok: false;
      error: "validation";
      fieldErrors: FieldErrorMap;
      formError?: string;
    }
  | { ok: false; error: "server"; formError: string };

const requirementSelect = {
  id: true,
  createdAt: true,
  companyName: true,
  gpuModel: true,
  quantity: true,
  region: true,
  timeframeStart: true,
  timeframeEnd: true,
  budgetMaxUsd: true,
  workloadType: true,
  status: true,
} as const;

type RequirementRecord = {
  id: string;
  createdAt: Date;
  companyName: string;
  gpuModel: string;
  quantity: number;
  region: string;
  timeframeStart: Date;
  timeframeEnd: Date;
  budgetMaxUsd: Prisma.Decimal;
  workloadType: string;
  status: string;
};

type RequirementWriter = {
  clientRequirement: {
    create: (args: {
      data: Prisma.ClientRequirementCreateInput;
      select: typeof requirementSelect;
    }) => Promise<RequirementRecord>;
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

function decimalToString(value: Prisma.Decimal | string): string {
  return typeof value === "string" ? value : value.toFixed(2);
}

export function toRequirementConfirmation(
  requirement: RequirementRecord,
): RequirementConfirmation {
  return {
    id: requirement.id,
    reference: formatRequirementReference(requirement.id),
    createdAt: requirement.createdAt.toISOString(),
    summary: {
      companyName: requirement.companyName,
      gpuModel: requirement.gpuModel,
      quantity: requirement.quantity,
      region: requirement.region,
      timeframeStart: requirement.timeframeStart.toISOString(),
      timeframeEnd: requirement.timeframeEnd.toISOString(),
      budgetMaxUsd: decimalToString(requirement.budgetMaxUsd),
      workloadType: requirement.workloadType,
    },
  };
}

export async function submitClientRequirement(
  input: unknown,
  deps: { prisma?: RequirementWriter; id?: string } = {},
): Promise<SubmitRequirementResult> {
  const parsed = ClientRequirementSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      fieldErrors: fieldErrorsFromZod(parsed.error),
      formError: "Fix the highlighted fields and submit again.",
    };
  }

  const prisma: RequirementWriter =
    deps.prisma ?? (getDirectPrisma() as unknown as RequirementWriter);
  const id = deps.id ?? randomUUID();
  const data = {
    ...mapClientRequirementCreate(input),
    id,
  };

  try {
    const [requirement] = (await prisma.$transaction(
      [
        prisma.clientRequirement.create({
          data,
          select: requirementSelect,
        }),
        prisma.auditLog.create({
          data: buildAuditLogCreate({
            entityType: "client_requirement",
            entityId: id,
            action: "created",
            beforeStatus: null,
            afterStatus: "submitted",
            metadata: { source: "public_form" },
          }),
        }),
      ],
      { maxWait: 15_000, timeout: 20_000 },
    )) as [RequirementRecord, unknown];

    return {
      ok: true,
      confirmation: toRequirementConfirmation(requirement),
    };
  } catch (error) {
    console.error("Failed to submit client requirement", error);
    return {
      ok: false,
      error: "server",
      formError: "We could not save this request. Try again.",
    };
  }
}

export async function getRequirementConfirmation(
  id: string,
  deps: { prisma?: PrismaClient } = {},
): Promise<RequirementConfirmation | null> {
  const prisma = deps.prisma ?? getPrisma();
  const requirement = await prisma.clientRequirement.findUnique({
    where: { id },
    select: requirementSelect,
  });

  if (!requirement) {
    return null;
  }

  return toRequirementConfirmation(requirement);
}
