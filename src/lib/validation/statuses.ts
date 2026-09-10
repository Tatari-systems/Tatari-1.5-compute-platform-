import { z } from "zod";

import {
  COMMITMENT_STATUSES,
  QUOTE_STATUSES,
  REQUIREMENT_STATUSES,
} from "@/lib/domain/statuses";

export const RequirementStatusSchema = z.enum(REQUIREMENT_STATUSES);
export const QuoteStatusSchema = z.enum(QUOTE_STATUSES);
export const CommitmentStatusSchema = z.enum(COMMITMENT_STATUSES);
