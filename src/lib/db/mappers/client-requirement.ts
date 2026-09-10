import { Prisma } from "@/generated/prisma/client";
import { ClientRequirementSchema } from "@/lib/validation";

export function mapClientRequirementCreate(
  input: unknown,
): Prisma.ClientRequirementCreateInput {
  const requirement = ClientRequirementSchema.parse(input);

  return {
    contactName: requirement.contactName,
    contactEmail: requirement.contactEmail,
    companyName: requirement.companyName,
    companyWebsite: requirement.companyWebsite,
    workloadType: requirement.workloadType,
    gpuModel: requirement.gpuModel,
    quantity: requirement.quantity,
    region: requirement.region,
    timeframeStart: requirement.timeframeStart,
    timeframeEnd: requirement.timeframeEnd,
    budgetMinUsd:
      requirement.budgetMinUsd === undefined
        ? undefined
        : new Prisma.Decimal(requirement.budgetMinUsd),
    budgetMaxUsd: new Prisma.Decimal(requirement.budgetMaxUsd),
    minimumUptimeBps: requirement.minimumUptimeBps,
    slaNotes: requirement.slaNotes,
    mustHaves: requirement.mustHaves as Prisma.InputJsonValue,
    niceToHaves: requirement.niceToHaves as Prisma.InputJsonValue,
    additionalNotes: requirement.additionalNotes,
    status: "submitted",
  };
}
