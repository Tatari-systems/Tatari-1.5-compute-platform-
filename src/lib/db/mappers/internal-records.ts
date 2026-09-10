import { Prisma } from "@/generated/prisma/client";

export const AUDIT_ENTITY_TYPES = [
  "client_requirement",
  "quote",
  "commitment",
] as const;

export const AUDIT_ACTIONS = ["created", "status_changed"] as const;

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
): Prisma.AuditLogCreateInput {
  return {
    entityType: options.entityType,
    entityId: options.entityId,
    action: options.action,
    beforeStatus: options.beforeStatus,
    afterStatus: options.afterStatus,
    metadata: options.metadata,
    actor:
      options.actorId === undefined
        ? undefined
        : { connect: { id: options.actorId } },
  };
}
