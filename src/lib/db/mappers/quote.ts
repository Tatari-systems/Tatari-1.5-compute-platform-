import { Prisma } from "@/generated/prisma/client";
import { CreateQuoteCommandSchema } from "@/lib/validation";

export function mapQuoteCreate(input: unknown): Prisma.QuoteCreateInput {
  const command = CreateQuoteCommandSchema.parse(input);
  const totalEstimatedCostUsd = command.lineItems.reduce(
    (total, lineItem) => total.plus(lineItem.totalEstimatedCostUsd),
    new Prisma.Decimal(0),
  );

  return {
    requirement: {
      connect: { id: command.requirementId },
    },
    status: "pending_approval",
    totalEstimatedCostUsd,
    expiresAt: command.expiresAt,
    lineItems: {
      create: command.lineItems.map((lineItem) => ({
        supply: {
          connect: { id: lineItem.supplyId },
        },
        vendorId: lineItem.vendorId,
        gpuModel: lineItem.gpuModel,
        region: lineItem.region,
        quantity: lineItem.quantity,
        hourlyPriceUsd: new Prisma.Decimal(lineItem.hourlyPriceUsd),
        billableHours: lineItem.billableHours,
        supplierSubtotalUsd: new Prisma.Decimal(lineItem.supplierSubtotalUsd),
        marginBps: lineItem.marginBps,
        platformFeeUsd: new Prisma.Decimal(lineItem.platformFeeUsd),
        totalEstimatedCostUsd: new Prisma.Decimal(
          lineItem.totalEstimatedCostUsd,
        ),
        minimumUptimeBps: lineItem.minimumUptimeBps,
      })),
    },
  };
}
