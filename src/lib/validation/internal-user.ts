import { z } from "zod";

import { INTERNAL_ROLES } from "@/lib/domain/roles";

const internalEmailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email("Enter a valid email address"),
);

const displayNameSchema = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => value || undefined);

export const InternalUserInputSchema = z.strictObject({
  id: z.string().trim().min(1).optional(),
  email: internalEmailSchema,
  displayName: displayNameSchema,
  role: z.enum(INTERNAL_ROLES).default("reviewer"),
  isActive: z.boolean().default(true),
});

export const GrantInternalAccessCommandSchema = z.strictObject({
  email: internalEmailSchema,
  displayName: displayNameSchema,
  role: z.enum(INTERNAL_ROLES).default("reviewer"),
  actorRole: z.string().trim().min(1),
});

export const SetInternalUserActiveCommandSchema = z.strictObject({
  id: z.uuid(),
  isActive: z.boolean(),
  actorRole: z.string().trim().min(1),
});

export type InternalUserInput = z.infer<typeof InternalUserInputSchema>;
export type GrantInternalAccessCommand = z.infer<
  typeof GrantInternalAccessCommandSchema
>;
export type SetInternalUserActiveCommand = z.infer<
  typeof SetInternalUserActiveCommandSchema
>;
