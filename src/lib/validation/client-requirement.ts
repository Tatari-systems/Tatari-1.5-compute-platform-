import { z } from "zod";

import { compareDecimalStrings, UsdAmountSchema } from "./money";

export const WORKLOAD_TYPES = [
  "ai_training",
  "fine_tuning",
  "inference",
  "research",
  "other",
] as const;

export const RequirementCriterionSchema = z.strictObject({
  key: z
    .string()
    .trim()
    .min(1, "Criterion key is required")
    .max(64)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Criterion key must use lowercase letters, numbers, and underscores",
    ),
  value: z.string().trim().min(1, "Criterion value is required").max(500),
});

const optionalWebsiteSchema = z
  .union([z.url("Enter a valid website URL"), z.literal("")])
  .optional()
  .transform((value) => value || undefined);

const utcDateTimeSchema = z
  .iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const positiveUsdAmountSchema = UsdAmountSchema.refine(
  (value) => compareDecimalStrings(value, "0") > 0,
  "Amount must be greater than zero",
);

export const ClientRequirementSchema = z
  .strictObject({
    contactName: z.string().trim().min(1, "Contact name is required").max(120),
    contactEmail: z.email("Enter a valid email address"),
    companyName: z.string().trim().min(1, "Company name is required").max(160),
    companyWebsite: optionalWebsiteSchema,
    workloadType: z.enum(WORKLOAD_TYPES),
    gpuModel: z.string().trim().min(1, "GPU model is required").max(80),
    quantity: z.int().min(1, "Quantity must be at least 1").max(10_000),
    region: z.string().trim().min(1, "Region is required").max(100),
    timeframeStart: utcDateTimeSchema,
    timeframeEnd: utcDateTimeSchema,
    budgetMinUsd: UsdAmountSchema.optional(),
    budgetMaxUsd: positiveUsdAmountSchema,
    minimumUptimeBps: z
      .int()
      .min(1, "Minimum uptime must be greater than zero")
      .max(10_000, "Minimum uptime cannot exceed 100%"),
    slaNotes: z.string().trim().max(1_000).optional(),
    mustHaves: z.array(RequirementCriterionSchema).max(20).default([]),
    niceToHaves: z.array(RequirementCriterionSchema).max(20).default([]),
    additionalNotes: z.string().trim().max(2_000).optional(),
  })
  .superRefine((requirement, context) => {
    if (requirement.timeframeStart >= requirement.timeframeEnd) {
      context.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["timeframeEnd"],
      });
    }

    if (
      requirement.budgetMinUsd !== undefined &&
      compareDecimalStrings(
        requirement.budgetMinUsd,
        requirement.budgetMaxUsd,
      ) > 0
    ) {
      context.addIssue({
        code: "custom",
        message: "Minimum budget cannot exceed maximum budget",
        path: ["budgetMinUsd"],
      });
    }

    const hardKeys = new Set(
      requirement.mustHaves.map((criterion) => criterion.key),
    );
    const duplicatePreference = requirement.niceToHaves.find((criterion) =>
      hardKeys.has(criterion.key),
    );

    if (duplicatePreference) {
      context.addIssue({
        code: "custom",
        message: `"${duplicatePreference.key}" cannot be both required and preferred`,
        path: ["niceToHaves"],
      });
    }
  });

export type ClientRequirementInput = z.input<
  typeof ClientRequirementSchema
>;
export type ClientRequirement = z.output<typeof ClientRequirementSchema>;
export type RequirementCriterion = z.infer<
  typeof RequirementCriterionSchema
>;
