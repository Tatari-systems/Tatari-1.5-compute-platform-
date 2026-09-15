import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth-buttons";
import { requireConsoleActor } from "@/lib/auth/console";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const actor = await requireConsoleActor();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-6 py-2">
        <p className="font-brand text-xs font-semibold uppercase tracking-[0.28em] text-text-faint">
          Internal · {actor.role}
        </p>
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <span>{actor.email}</span>
          <SignOutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
