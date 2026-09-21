import { type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

import { E2E_APPROVER } from "../constants";

function sessionCookieName(baseURL: string): string {
  return new URL(baseURL).protocol === "https:"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

export async function signInAsApprover(
  context: BrowserContext,
  baseURL: string,
): Promise<void> {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required to mint a Playwright session.");
  }

  const cookieName = sessionCookieName(baseURL);
  const token = await encode({
    salt: cookieName,
    secret,
    token: {
      email: E2E_APPROVER.email,
      name: E2E_APPROVER.displayName,
      sub: E2E_APPROVER.id,
      internalUserId: E2E_APPROVER.id,
      role: E2E_APPROVER.role,
    },
  });

  await context.addCookies([
    {
      name: cookieName,
      value: token,
      domain: new URL(baseURL).hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
