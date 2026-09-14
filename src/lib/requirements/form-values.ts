import type { Resolver } from "react-hook-form";

import { ClientRequirementSchema } from "@/lib/validation";

import { toHookFormErrors } from "./field-errors";

export type RequirementCriterionFormValue = {
  key: string;
  value: string;
};

export type RequirementFormValues = {
  contactName: string;
  contactEmail: string;
  companyName: string;
  companyWebsite: string;
  workloadType: string;
  gpuModel: string;
  quantity: number | "";
  region: string;
  timeframeStart: string;
  timeframeEnd: string;
  budgetMinUsd: string;
  budgetMaxUsd: string;
  minimumUptimeBps: number | "";
  slaNotes: string;
  mustHaves: RequirementCriterionFormValue[];
  niceToHaves: RequirementCriterionFormValue[];
  additionalNotes: string;
};

export const defaultRequirementFormValues: RequirementFormValues = {
  contactName: "",
  contactEmail: "",
  companyName: "",
  companyWebsite: "",
  workloadType: "",
  gpuModel: "",
  quantity: "",
  region: "",
  timeframeStart: "",
  timeframeEnd: "",
  budgetMinUsd: "",
  budgetMaxUsd: "",
  minimumUptimeBps: 9990,
  slaNotes: "",
  mustHaves: [],
  niceToHaves: [],
  additionalNotes: "",
};

function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function toNumber(value: number | string): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function localDateTimeToIsoOffset(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toISOString();
}

function compactCriteria(
  criteria: RequirementCriterionFormValue[],
): RequirementCriterionFormValue[] {
  return criteria.filter(
    (criterion) =>
      criterion.key.trim().length > 0 || criterion.value.trim().length > 0,
  );
}

export function normalizeRequirementFormValues(
  values: RequirementFormValues,
): unknown {
  return {
    contactName: values.contactName,
    contactEmail: values.contactEmail,
    companyName: values.companyName,
    companyWebsite: blankToUndefined(values.companyWebsite),
    workloadType: values.workloadType,
    gpuModel: values.gpuModel,
    quantity: toNumber(values.quantity),
    region: values.region,
    timeframeStart: localDateTimeToIsoOffset(values.timeframeStart),
    timeframeEnd: localDateTimeToIsoOffset(values.timeframeEnd),
    budgetMinUsd: blankToUndefined(values.budgetMinUsd),
    budgetMaxUsd: values.budgetMaxUsd,
    minimumUptimeBps: toNumber(values.minimumUptimeBps),
    slaNotes: blankToUndefined(values.slaNotes),
    mustHaves: compactCriteria(values.mustHaves),
    niceToHaves: compactCriteria(values.niceToHaves),
    additionalNotes: blankToUndefined(values.additionalNotes),
  };
}

export const requirementFormResolver: Resolver<RequirementFormValues> = async (
  values,
) => {
  const parsed = ClientRequirementSchema.safeParse(
    normalizeRequirementFormValues(values),
  );

  if (parsed.success) {
    return { values, errors: {} };
  }

  return {
    values: {},
    errors: toHookFormErrors<RequirementFormValues>(parsed.error),
  };
};
