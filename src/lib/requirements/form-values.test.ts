import { describe, expect, it } from "vitest";

import {
  localDateTimeToIsoOffset,
  normalizeRequirementFormValues,
  requirementFormResolver,
  type RequirementFormValues,
} from "@/lib/requirements/form-values";
import { formatRequirementReference } from "@/lib/requirements/reference";
import { ClientRequirementSchema } from "@/lib/validation";
import { validRequirementInput } from "@/test/fixtures/marketplace";

const validFormValues: RequirementFormValues = {
  contactName: validRequirementInput.contactName,
  contactEmail: validRequirementInput.contactEmail,
  companyName: validRequirementInput.companyName,
  companyWebsite: validRequirementInput.companyWebsite,
  workloadType: validRequirementInput.workloadType,
  gpuModel: validRequirementInput.gpuModel,
  quantity: validRequirementInput.quantity,
  region: validRequirementInput.region,
  timeframeStart: "2026-10-01T00:00",
  timeframeEnd: "2026-10-15T00:00",
  budgetMinUsd: validRequirementInput.budgetMinUsd,
  budgetMaxUsd: validRequirementInput.budgetMaxUsd,
  minimumUptimeBps: validRequirementInput.minimumUptimeBps,
  slaNotes: validRequirementInput.slaNotes ?? "",
  mustHaves: validRequirementInput.mustHaves,
  niceToHaves: validRequirementInput.niceToHaves,
  additionalNotes: validRequirementInput.additionalNotes ?? "",
};

describe("requirement form values", () => {
  it("converts local datetime-local values into ISO timestamps", () => {
    const iso = localDateTimeToIsoOffset("2026-10-01T03:00");

    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(iso).toISOString()).toBe(iso);
  });

  it("drops empty optional fields and unused criterion rows", () => {
    const payload = normalizeRequirementFormValues({
      ...validFormValues,
      companyWebsite: "  ",
      budgetMinUsd: "",
      slaNotes: "",
      additionalNotes: "",
      mustHaves: [
        { key: "", value: "" },
        { key: "minimum_vram_gb", value: "80" },
      ],
      niceToHaves: [{ key: "", value: "" }],
    });

    expect(payload).toMatchObject({
      companyWebsite: undefined,
      budgetMinUsd: undefined,
      slaNotes: undefined,
      additionalNotes: undefined,
      mustHaves: [{ key: "minimum_vram_gb", value: "80" }],
      niceToHaves: [],
    });
    expect(ClientRequirementSchema.safeParse(payload).success).toBe(true);
  });

  it("does not produce a server payload when the form is invalid", async () => {
    const result = await requirementFormResolver(
      {
        ...validFormValues,
        budgetMinUsd: "40000.00",
        budgetMaxUsd: "30000.00",
      },
      undefined as never,
      undefined as never,
    );

    expect(result.errors).toMatchObject({
      budgetMinUsd: { message: "Minimum budget cannot exceed maximum budget" },
    });
    expect(result.values).toEqual({});
  });
});

describe("requirement reference", () => {
  it("builds a short public reference from a UUID", () => {
    expect(
      formatRequirementReference("11111111-1111-4111-8111-111111111111"),
    ).toBe("REQ-11111111");
  });
});
