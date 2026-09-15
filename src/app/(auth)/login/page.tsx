import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { GoogleSignInButton, SignOutButton } from "@/components/auth-buttons";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { resolveConsoleActor } from "@/lib/auth/internal-users";
import { loginErrorMessage } from "@/lib/auth/login-errors";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const session = await auth();
  const actor = await resolveConsoleActor(session);

  if (actor) {
    redirect(callbackUrl === "/" ? "/" : callbackUrl);
  }

  const errorMessage = params.error
    ? loginErrorMessage(params.error)
    : undefined;
  const hasStaleSession = Boolean(session?.user) && !actor;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center px-6 py-14">
      <section className="w-full space-y-8">
        <div className="space-y-4">
          <p className="font-brand text-xs font-semibold uppercase tracking-[0.28em] text-text-faint">
            Internal
          </p>
          <h1 className="font-display text-4xl leading-tight text-text sm:text-5xl">
            Sign in to review quotes
          </h1>
          <p className="max-w-md text-base leading-7 text-text-muted">
            Use an approved Tatari Google account. A matching email in the
            internal user list is required. A company domain alone is not
            enough.
          </p>
        </div>

        {errorMessage || hasStaleSession ? (
          <p
            role="alert"
            className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-danger"
          >
            {errorMessage ??
              "This Google account is not approved for Tatari internal access."}
          </p>
        ) : null}

        <div className="rounded-card border border-border bg-surface p-6">
          {hasStaleSession ? (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                Signed in as {session?.user?.email}. Sign out, then try an
                approved account.
              </p>
              <SignOutButton />
            </div>
          ) : (
            <GoogleSignInButton callbackUrl={callbackUrl} />
          )}
        </div>
      </section>
    </main>
  );
}
