import { getPrisma } from "../src/lib/db/client";
import { mapGpuSupplyCreate } from "../src/lib/db/mappers/gpu-supply";
import { seedGpuSupplies } from "./seed-data";

const prisma = getPrisma();

async function main() {
  for (const supplyInput of seedGpuSupplies) {
    const { id, ...values } = mapGpuSupplyCreate(supplyInput);

    await prisma.gpuSupply.upsert({
      where: { id },
      create: { id, ...values },
      update: values,
    });
  }

  console.info(`Seeded ${seedGpuSupplies.length} deterministic GPU supplies.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
