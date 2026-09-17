import { getPrisma } from "../src/lib/db/client";
import { mapGpuSupplyCreate } from "../src/lib/db/mappers/gpu-supply";
import { mapInternalUserCreate } from "../src/lib/db/mappers/internal-user";
import { seedGpuSupplies, seedInternalUsers } from "./seed-data";

const prisma = getPrisma();

function bootstrapAdminEmail(): string | null {
  const email = process.env.INTERNAL_BOOTSTRAP_EMAIL?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  if (seedInternalUsers.some((user) => user.email === email)) {
    return null;
  }

  return email;
}

async function main() {
  for (const supplyInput of seedGpuSupplies) {
    const { id, ...values } = mapGpuSupplyCreate(supplyInput);

    await prisma.gpuSupply.upsert({
      where: { id },
      create: { id, ...values },
      update: values,
    });
  }

  for (const userInput of seedInternalUsers) {
    const { id, ...values } = mapInternalUserCreate(userInput);

    await prisma.internalUser.upsert({
      where: { email: values.email },
      create: { id, ...values },
      update: values,
    });
  }

  const bootstrapEmail = bootstrapAdminEmail();

  if (bootstrapEmail) {
    await prisma.internalUser.upsert({
      where: { email: bootstrapEmail },
      create: mapInternalUserCreate({ email: bootstrapEmail, role: "admin" }),
      update: { isActive: true },
    });
  }

  console.info(
    `Seeded ${seedGpuSupplies.length} deterministic GPU supplies and ${seedInternalUsers.length} internal users.`,
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
