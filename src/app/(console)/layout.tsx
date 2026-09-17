import type { ReactNode } from "react";

import { ConsoleChrome } from "@/components/console/console-chrome";
import { requireConsoleActor } from "@/lib/auth/console";

export default async function ConsoleLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const actor = await requireConsoleActor();

  return <ConsoleChrome email={actor.email}>{children}</ConsoleChrome>;
}
