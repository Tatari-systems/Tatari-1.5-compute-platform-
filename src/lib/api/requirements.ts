"use server";

import { proposeQuoteForRequirement } from "@/lib/matching/proposeQuote";
import { submitClientRequirement } from "@/lib/services/requirements";
import type { SubmitRequirementResult } from "@/lib/services/requirements";

export async function submitRequirementAction(
  input: unknown,
): Promise<SubmitRequirementResult> {
  const result = await submitClientRequirement(input);

  if (result.ok) {
    const matching = await proposeQuoteForRequirement(result.confirmation.id);
    if (!matching.ok) {
      console.error(
        "Matching did not complete after requirement save",
        matching,
      );
    }
  }

  return result;
}
