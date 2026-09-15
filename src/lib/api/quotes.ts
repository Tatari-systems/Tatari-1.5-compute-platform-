"use server";

import { revalidatePath } from "next/cache";

import { requireConsoleActor } from "@/lib/auth/console";
import {
  decideQuote,
  type DecideQuoteResult,
} from "@/lib/services/quote-decision";

export async function decideQuoteAction(
  input: unknown,
): Promise<DecideQuoteResult> {
  const actor = await requireConsoleActor();
  const result = await decideQuote(input, {
    id: actor.id,
    role: actor.role,
  });

  if (result.ok) {
    revalidatePath(`/quotes/${result.requirementId}`);
  }

  return result;
}
