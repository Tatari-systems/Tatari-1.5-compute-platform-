import { z } from "zod";

import { getDirectPrisma } from "@/lib/db/client";
import { mapInternalUserCreate } from "@/lib/db/mappers";
import { canAdminister } from "@/lib/domain/roles";
import {
  fieldErrorsFromZod,
  type FieldErrorMap,
} from "@/lib/requirements/field-errors";
import {
  GrantInternalAccessCommandSchema,
  SetInternalUserActiveCommandSchema,
} from "@/lib/validation";

export type InternalUserSummary = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
};

export type GrantInternalAccessResult =
  | { ok: true; user: InternalUserSummary }
  | {
      ok: false;
      error: "validation" | "forbidden" | "server";
      formError: string;
      fieldErrors?: FieldErrorMap;
    };

export type SetInternalUserActiveResult =
  | { ok: true; user: InternalUserSummary }
  | {
      ok: false;
      error: "validation" | "forbidden" | "not_found" | "server";
      formError: string;
      fieldErrors?: FieldErrorMap;
    };

type InternalUserWriter = {
  internalUser: {
    upsert: (args: unknown) => Promise<InternalUserSummary>;
    update: (args: unknown) => Promise<InternalUserSummary>;
  };
};

const actorSchema = z.object({ actorRole: z.string() });

const internalUserSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  isActive: true,
} as const;

function isAdminActor(input: unknown): boolean {
  const parsed = actorSchema.safeParse(input);
  return parsed.success && canAdminister(parsed.data.actorRole);
}

function isRecordNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}

export async function grantInternalAccess(
  input: unknown,
  deps: { prisma?: InternalUserWriter } = {},
): Promise<GrantInternalAccessResult> {
  if (!isAdminActor(input)) {
    return {
      ok: false,
      error: "forbidden",
      formError: "Only admins can grant internal access.",
    };
  }

  const parsed = GrantInternalAccessCommandSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      fieldErrors: fieldErrorsFromZod(parsed.error),
      formError: "Fix the highlighted fields and submit again.",
    };
  }

  const command = parsed.data;
  const prisma: InternalUserWriter =
    deps.prisma ?? (getDirectPrisma() as unknown as InternalUserWriter);

  try {
    const user = await prisma.internalUser.upsert({
      where: { email: command.email },
      create: mapInternalUserCreate({
        email: command.email,
        role: command.role,
        ...(command.displayName ? { displayName: command.displayName } : {}),
      }),
      update: {
        role: command.role,
        isActive: true,
        ...(command.displayName ? { displayName: command.displayName } : {}),
      },
      select: internalUserSelect,
    });

    return { ok: true, user };
  } catch (error) {
    console.error("Failed to grant internal access", error);
    return {
      ok: false,
      error: "server",
      formError: "We could not grant access. Try again.",
    };
  }
}

export async function setInternalUserActive(
  input: unknown,
  deps: { prisma?: InternalUserWriter } = {},
): Promise<SetInternalUserActiveResult> {
  if (!isAdminActor(input)) {
    return {
      ok: false,
      error: "forbidden",
      formError: "Only admins can change internal access.",
    };
  }

  const parsed = SetInternalUserActiveCommandSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      fieldErrors: fieldErrorsFromZod(parsed.error),
      formError: "Fix the highlighted fields and submit again.",
    };
  }

  const command = parsed.data;
  const prisma: InternalUserWriter =
    deps.prisma ?? (getDirectPrisma() as unknown as InternalUserWriter);

  try {
    const user = await prisma.internalUser.update({
      where: { id: command.id },
      data: { isActive: command.isActive },
      select: internalUserSelect,
    });

    return { ok: true, user };
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return {
        ok: false,
        error: "not_found",
        formError: "That internal user was not found.",
      };
    }

    console.error("Failed to change internal user access", error);
    return {
      ok: false,
      error: "server",
      formError: "We could not save this change. Try again.",
    };
  }
}
