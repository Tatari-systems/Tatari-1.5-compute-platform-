import "dotenv/config";

import { getPrisma } from "../src/lib/db/client";
import { seedGpuSupplies } from "./seed-data";

const prisma = getPrisma();

async function main() {
  const expectedIds = seedGpuSupplies.map((supply) => supply.id).sort();
  const supplies = await prisma.gpuSupply.findMany({
    where: { id: { in: expectedIds } },
    orderBy: { id: "asc" },
    select: {
      id: true,
      quantityAvailable: true,
      hourlyPriceUsd: true,
      sourceType: true,
      isTestData: true,
    },
  });

  if (supplies.length !== expectedIds.length) {
    throw new Error(
      `Expected ${expectedIds.length} seed supplies, found ${supplies.length}`,
    );
  }

  if (
    supplies.some(
      (supply) => supply.sourceType !== "seed" || !supply.isTestData,
    )
  ) {
    throw new Error("Every deterministic supply must be marked as seed data");
  }

  if (
    supplies.some(
      (supply) =>
        supply.quantityAvailable <= 0 || !supply.hourlyPriceUsd.isPositive(),
    )
  ) {
    throw new Error("Every deterministic supply must have positive capacity");
  }

  if (supplies.some((supply, index) => supply.id !== expectedIds[index])) {
    throw new Error("The database does not contain the expected stable IDs");
  }

  console.info(
    `Verified ${supplies.length} deterministic GPU supply records and their data markers.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
