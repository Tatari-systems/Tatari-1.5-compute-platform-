import { Prisma } from "@/generated/prisma/client";

import { InternalUserInputSchema } from "@/lib/validation/internal-user";

export function mapInternalUserCreate(
  input: unknown,
): Prisma.InternalUserUncheckedCreateInput {
  const parsed = InternalUserInputSchema.parse(input);

  return {
    ...(parsed.id ? { id: parsed.id } : {}),
    email: parsed.email,
    ...(parsed.displayName ? { displayName: parsed.displayName } : {}),
    role: parsed.role,
    isActive: parsed.isActive,
  };
}
