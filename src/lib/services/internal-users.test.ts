import { describe, expect, it, vi } from "vitest";

import { isApprovedInternalUser } from "@/lib/auth/internal-users";
import {
  grantInternalAccess,
  setInternalUserActive,
  type InternalUserSummary,
} from "@/lib/services/internal-users";

const admin = { actorRole: "admin" };
const grantedId = "44444444-4444-4444-8444-444444444444";

function createWriter(seed: readonly InternalUserSummary[] = []) {
  const users = seed.map((user) => ({ ...user }));

  const prisma = {
    internalUser: {
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { email: string };
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => {
          const existing = users.find((user) => user.email === where.email);

          if (existing) {
            Object.assign(existing, update);
            return { ...existing };
          }

          const record = {
            id: grantedId,
            displayName: null,
            isActive: true,
            ...create,
          } as InternalUserSummary;
          users.push(record);
          return { ...record };
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const existing = users.find((user) => user.id === where.id);

          if (!existing) {
            const error = new Error("Record to update not found") as Error & {
              code: string;
            };
            error.code = "P2025";
            throw error;
          }

          Object.assign(existing, data);
          return { ...existing };
        },
      ),
    },
  };

  return { prisma, users };
}

describe("grantInternalAccess", () => {
  it("creates an active user from a normalized email", async () => {
    const { prisma, users } = createWriter();

    const result = await grantInternalAccess(
      { ...admin, email: "  New.Reviewer@Tatari.TEST ", role: "reviewer" },
      { prisma: prisma as never },
    );

    expect(result).toEqual({
      ok: true,
      user: {
        id: grantedId,
        email: "new.reviewer@tatari.test",
        displayName: null,
        role: "reviewer",
        isActive: true,
      },
    });
    expect(users).toHaveLength(1);
  });

  it("updates the existing row when the same email is granted again", async () => {
    const { prisma, users } = createWriter();

    await grantInternalAccess(
      { ...admin, email: "staff@tatari.test", role: "reviewer" },
      { prisma: prisma as never },
    );
    const result = await grantInternalAccess(
      {
        ...admin,
        email: "STAFF@tatari.test",
        role: "approver",
        displayName: "Staff Member",
      },
      { prisma: prisma as never },
    );

    expect(users).toHaveLength(1);
    expect(result.ok && result.user).toEqual({
      id: grantedId,
      email: "staff@tatari.test",
      displayName: "Staff Member",
      role: "approver",
      isActive: true,
    });
  });

  it("reactivates a deactivated user", async () => {
    const { prisma } = createWriter([
      {
        id: grantedId,
        email: "staff@tatari.test",
        displayName: "Staff Member",
        role: "reviewer",
        isActive: false,
      },
    ]);

    const result = await grantInternalAccess(
      { ...admin, email: "staff@tatari.test", role: "reviewer" },
      { prisma: prisma as never },
    );

    expect(result.ok && result.user.isActive).toBe(true);
  });

  it("refuses non-admin actors before touching the database", async () => {
    const { prisma } = createWriter();

    for (const actorRole of ["reviewer", "approver", "public", ""]) {
      await expect(
        grantInternalAccess(
          { actorRole, email: "staff@tatari.test" },
          { prisma: prisma as never },
        ),
      ).resolves.toMatchObject({ ok: false, error: "forbidden" });
    }

    expect(prisma.internalUser.upsert).not.toHaveBeenCalled();
  });

  it("reports field errors for an invalid email", async () => {
    const { prisma } = createWriter();

    const result = await grantInternalAccess(
      { ...admin, email: "not-an-email" },
      { prisma: prisma as never },
    );

    expect(result).toMatchObject({ ok: false, error: "validation" });
    expect(result.ok === false && result.fieldErrors?.email).toBeDefined();
    expect(prisma.internalUser.upsert).not.toHaveBeenCalled();
  });
});

describe("setInternalUserActive", () => {
  it("deactivates a user so console access is no longer approved", async () => {
    const { prisma } = createWriter([
      {
        id: grantedId,
        email: "staff@tatari.test",
        displayName: "Staff Member",
        role: "approver",
        isActive: true,
      },
    ]);

    const result = await setInternalUserActive(
      { ...admin, id: grantedId, isActive: false },
      { prisma: prisma as never },
    );

    expect(result.ok).toBe(true);
    expect(result.ok && isApprovedInternalUser(result.user)).toBe(false);
  });

  it("reports a missing row instead of failing", async () => {
    const { prisma } = createWriter();

    await expect(
      setInternalUserActive(
        { ...admin, id: grantedId, isActive: false },
        { prisma: prisma as never },
      ),
    ).resolves.toMatchObject({ ok: false, error: "not_found" });
  });

  it("refuses non-admin actors", async () => {
    const { prisma } = createWriter();

    await expect(
      setInternalUserActive(
        { actorRole: "approver", id: grantedId, isActive: false },
        { prisma: prisma as never },
      ),
    ).resolves.toMatchObject({ ok: false, error: "forbidden" });
    expect(prisma.internalUser.update).not.toHaveBeenCalled();
  });
});
