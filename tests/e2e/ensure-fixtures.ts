import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../src/generated/prisma/client";
import { seedGpuSupplies } from "../../prisma/seed-data";

import { E2E_APPROVER } from "./constants";

config({ path: ".env" });
config({ path: ".env.local", override: true });

function createPrisma(): PrismaClient {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DIRECT_URL or DATABASE_URL is required to prepare Playwright fixtures.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export default async function ensureE2eFixtures(): Promise<void> {
  const prisma = createPrisma();

  try {
    for (const supply of seedGpuSupplies) {
      const values = {
        vendorId: supply.vendorId,
        gpuModel: supply.gpuModel,
        quantityAvailable: supply.quantityAvailable,
        region: supply.region,
        hourlyPriceUsd: supply.hourlyPriceUsd,
        minimumUptimeBps: supply.minimumUptimeBps,
        availableFrom: new Date(supply.availableFrom),
        availableUntil: new Date(supply.availableUntil),
        status: supply.status,
        sourceType: supply.sourceType,
        isTestData: supply.isTestData,
        sourceReference: supply.sourceReference ?? null,
        lastVerifiedAt: supply.lastVerifiedAt
          ? new Date(supply.lastVerifiedAt)
          : null,
        metadata: supply.metadata ?? undefined,
      };

      await prisma.gpuSupply.upsert({
        where: { id: supply.id },
        create: { id: supply.id, ...values },
        update: values,
      });
    }

    await prisma.internalUser.upsert({
      where: { email: E2E_APPROVER.email },
      create: {
        id: E2E_APPROVER.id,
        email: E2E_APPROVER.email,
        displayName: E2E_APPROVER.displayName,
        role: E2E_APPROVER.role,
        isActive: true,
      },
      update: {
        displayName: E2E_APPROVER.displayName,
        role: E2E_APPROVER.role,
        isActive: true,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
