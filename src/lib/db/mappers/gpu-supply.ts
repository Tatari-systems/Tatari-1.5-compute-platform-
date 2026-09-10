import { Prisma } from "@/generated/prisma/client";
import { GpuSupplySchema } from "@/lib/validation";

export function mapGpuSupplyCreate(
  input: unknown,
): Prisma.GpuSupplyCreateInput {
  const supply = GpuSupplySchema.parse(input);

  return {
    id: supply.id,
    vendorId: supply.vendorId,
    gpuModel: supply.gpuModel,
    quantityAvailable: supply.quantityAvailable,
    region: supply.region,
    hourlyPriceUsd: new Prisma.Decimal(supply.hourlyPriceUsd),
    minimumUptimeBps: supply.minimumUptimeBps,
    availableFrom: supply.availableFrom,
    availableUntil: supply.availableUntil,
    status: supply.status,
    sourceType: supply.sourceType,
    isTestData: supply.isTestData,
    sourceReference: supply.sourceReference,
    lastVerifiedAt: supply.lastVerifiedAt,
    metadata: supply.metadata as Prisma.InputJsonValue | undefined,
  };
}
