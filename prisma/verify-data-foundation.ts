import "dotenv/config";

import { getPrisma } from "../src/lib/db/client";
import { INTERNAL_ROLES } from "../src/lib/domain/roles";
import { seedGpuSupplies, seedInternalUsers } from "./seed-data";

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

  const expectedUsers = [...seedInternalUsers].sort((left, right) =>
    left.email.localeCompare(right.email),
  );
  const users = await prisma.internalUser.findMany({
    where: { email: { in: expectedUsers.map((user) => user.email) } },
    orderBy: { email: "asc" },
    select: {
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (users.length !== expectedUsers.length) {
    throw new Error(
      `Expected ${expectedUsers.length} seed internal users, found ${users.length}`,
    );
  }

  if (users.some((user) => !user.isActive)) {
    throw new Error("Every deterministic internal user must be active");
  }

  if (users.some((user) => user.email !== user.email.toLowerCase())) {
    throw new Error("Every internal user email must be stored lowercase");
  }

  if (
    users.some(
      (user, index) =>
        user.email !== expectedUsers[index]?.email ||
        user.role !== expectedUsers[index]?.role,
    )
  ) {
    throw new Error(
      "The database does not contain the expected internal users and roles",
    );
  }

  if (new Set(users.map((user) => user.role)).size !== INTERNAL_ROLES.length) {
    throw new Error("Deterministic internal users must cover every role");
  }

  console.info(
    `Verified ${supplies.length} deterministic GPU supply records and ${users.length} internal users.`,
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
