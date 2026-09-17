import { Prisma } from "@/generated/prisma/client";

export const AUDIT_ENTITY_TYPES = [
  "client_requirement",
  "quote",
  "commitment",
  "project",
  "task",
] as const;

export const AUDIT_ACTIONS = [
  "created",
  "status_changed",
  "updated",
  "archived",
] as const;

type AuditLogCreateOptions = {
  entityType: (typeof AUDIT_ENTITY_TYPES)[number];
  entityId: string;
  action: (typeof AUDIT_ACTIONS)[number];
  beforeStatus: string | null;
  afterStatus: string | null;
  actorId?: string;
  metadata?: Prisma.InputJsonObject;
};

export function buildCommitmentCreate(
  quoteId: string,
): Prisma.CommitmentCreateInput {
  return {
    quote: { connect: { id: quoteId } },
    status: "pending_delivery",
  };
}

export function buildAuditLogCreate(
  options: AuditLogCreateOptions,
): Prisma.AuditLogUncheckedCreateInput {
  return {
    entityType: options.entityType,
    entityId: options.entityId,
    action: options.action,
    beforeStatus: options.beforeStatus,
    afterStatus: options.afterStatus,
    ...(options.metadata === undefined ? {} : { metadata: options.metadata }),
    ...(options.actorId === undefined ? {} : { actorId: options.actorId }),
  };
}
