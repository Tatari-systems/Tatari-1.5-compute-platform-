import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  resolveConsoleActor,
  type ConsoleActor,
} from "@/lib/auth/internal-users";

export async function requireConsoleActor(): Promise<ConsoleActor> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const actor = await resolveConsoleActor(session);

  if (!actor) {
    redirect("/login?error=AccessDenied");
  }

  return actor;
}
