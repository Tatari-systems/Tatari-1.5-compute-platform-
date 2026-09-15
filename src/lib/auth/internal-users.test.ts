import { describe, expect, it } from "vitest";

import { safeCallbackUrl } from "./callback-url";
import {
  findActiveInternalUserByEmail,
  isApprovedInternalUser,
  normalizeEmail,
  resolveConsoleActor,
} from "./internal-users";
import { loginErrorMessage } from "./login-errors";

const reviewer = {
  id: "00000000-0000-4000-8000-000000000101",
  email: "reviewer@tatari.test",
  displayName: "Seed Reviewer",
  role: "reviewer",
  isActive: true,
};

describe("internal user access", () => {
  it("normalizes emails before lookup", () => {
    expect(normalizeEmail("  Reviewer@Tatari.TEST ")).toBe(
      "reviewer@tatari.test",
    );
  });

  it("rejects missing, inactive, and unknown-role users", () => {
    expect(isApprovedInternalUser(null)).toBe(false);
    expect(isApprovedInternalUser({ ...reviewer, isActive: false })).toBe(
      false,
    );
    expect(isApprovedInternalUser({ ...reviewer, role: "public" })).toBe(false);
    expect(isApprovedInternalUser(reviewer)).toBe(true);
  });

  it("looks up an active console user by email", async () => {
    const prisma = {
      internalUser: {
        findUnique: async () => reviewer,
      },
    };

    await expect(
      findActiveInternalUserByEmail("Reviewer@Tatari.test", { prisma }),
    ).resolves.toEqual(reviewer);
  });

  it("does not treat an inactive database row as a console actor", async () => {
    const prisma = {
      internalUser: {
        findUnique: async () => ({ ...reviewer, isActive: false }),
      },
    };

    await expect(
      findActiveInternalUserByEmail(reviewer.email, { prisma }),
    ).resolves.toBeNull();
  });

  it("resolves a console actor only from a trusted session email", async () => {
    const lookup = async (email: string) =>
      email === reviewer.email ? reviewer : null;

    await expect(
      resolveConsoleActor({ user: { email: reviewer.email } }, lookup),
    ).resolves.toEqual({
      id: reviewer.id,
      email: reviewer.email,
      displayName: reviewer.displayName,
      role: "reviewer",
    });
    await expect(resolveConsoleActor(null, lookup)).resolves.toBeNull();
    await expect(
      resolveConsoleActor({ user: { email: "unknown@tatari.test" } }, lookup),
    ).resolves.toBeNull();
  });
});

describe("login helpers", () => {
  it("rejects unsafe callback URLs", () => {
    expect(safeCallbackUrl("//evil.example")).toBe("/");
    expect(safeCallbackUrl("/login")).toBe("/");
    expect(safeCallbackUrl("/api/auth/session")).toBe("/");
    expect(
      safeCallbackUrl(
        "http://localhost:3000/quotes/83ae0356-b070-4bab-ba1a-efb72080aa82",
      ),
    ).toBe("/quotes/83ae0356-b070-4bab-ba1a-efb72080aa82");
    expect(
      safeCallbackUrl("/quotes/83ae0356-b070-4bab-ba1a-efb72080aa82"),
    ).toBe("/quotes/83ae0356-b070-4bab-ba1a-efb72080aa82");
  });

  it("explains access denial without exposing internals", () => {
    expect(loginErrorMessage("AccessDenied")).toMatch(/not approved/);
    expect(loginErrorMessage("nope")).toMatch(/could not sign you in/i);
  });
});
