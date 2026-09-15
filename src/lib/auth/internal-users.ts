import { getPrisma } from "@/lib/db/client";
import { canReview } from "@/lib/domain/roles";
import type { InternalRole } from "@/lib/domain/roles";

export type InternalUserRecord = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
};

export type ConsoleActor = {
  id: string;
  email: string;
  displayName: string | null;
  role: InternalRole;
};

type InternalUserReader = {
  internalUser: {
    findUnique: (args: {
      where: { email: string };
      select: {
        id: true;
        email: true;
        displayName: true;
        role: true;
        isActive: true;
      };
    }) => Promise<InternalUserRecord | null>;
  };
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isApprovedInternalUser(
  user: InternalUserRecord | null,
): user is InternalUserRecord & { role: InternalRole } {
  return Boolean(user && user.isActive && canReview(user.role));
}

export async function findActiveInternalUserByEmail(
  email: string,
  deps: { prisma?: InternalUserReader } = {},
): Promise<InternalUserRecord | null> {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return null;
  }

  const prisma = deps.prisma ?? (getPrisma() as unknown as InternalUserReader);
  const user = await prisma.internalUser.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      isActive: true,
    },
  });

  if (!isApprovedInternalUser(user)) {
    return null;
  }

  return user;
}

export async function resolveConsoleActor(
  session: { user?: { email?: string | null } } | null,
  lookup: (email: string) => Promise<InternalUserRecord | null> = (email) =>
    findActiveInternalUserByEmail(email),
): Promise<ConsoleActor | null> {
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const user = await lookup(email);

  if (!isApprovedInternalUser(user)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
