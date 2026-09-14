"use server";

import { submitClientRequirement } from "@/lib/services/requirements";
import type { SubmitRequirementResult } from "@/lib/services/requirements";

export async function submitRequirementAction(
  input: unknown,
): Promise<SubmitRequirementResult> {
  return submitClientRequirement(input);
}
