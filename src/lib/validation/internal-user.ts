import { z } from "zod";

import { INTERNAL_ROLES } from "@/lib/domain/roles";

export const InternalUserInputSchema = z.strictObject({
  id: z.string().trim().min(1).optional(),
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.email("Enter a valid email address"),
  ),
  displayName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || undefined),
  role: z.enum(INTERNAL_ROLES).default("reviewer"),
  isActive: z.boolean().default(true),
});

export type InternalUserInput = z.infer<typeof InternalUserInputSchema>;
