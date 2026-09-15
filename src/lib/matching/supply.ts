import type { Prisma } from "@/generated/prisma/client";
import { GpuSupplySchema, type GpuSupply } from "@/lib/validation";

export function toMatchableSupply(row: {
  id: string;
  vendorId: string;
  gpuModel: string;
  quantityAvailable: number;
  region: string;
  hourlyPriceUsd: Prisma.Decimal | string;
  minimumUptimeBps: number;
  availableFrom: Date;
  availableUntil: Date;
  status: string;
  sourceType: string;
  isTestData: boolean;
  sourceReference: string | null;
  lastVerifiedAt: Date | null;
  metadata: Prisma.JsonValue;
}): GpuSupply | null {
  const parsed = GpuSupplySchema.safeParse({
    id: row.id,
    vendorId: row.vendorId,
    gpuModel: row.gpuModel,
    quantityAvailable: row.quantityAvailable,
    region: row.region,
    hourlyPriceUsd:
      typeof row.hourlyPriceUsd === "string"
        ? row.hourlyPriceUsd
        : row.hourlyPriceUsd.toFixed(6),
    minimumUptimeBps: row.minimumUptimeBps,
    availableFrom: row.availableFrom.toISOString(),
    availableUntil: row.availableUntil.toISOString(),
    status: row.status,
    sourceType: row.sourceType,
    isTestData: row.isTestData,
    sourceReference: row.sourceReference ?? undefined,
    lastVerifiedAt: row.lastVerifiedAt?.toISOString(),
    metadata:
      row.metadata &&
      typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
        ? row.metadata
        : undefined,
  });

  return parsed.success ? parsed.data : null;
}
