import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  directPrisma?: PrismaClient;
};

function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

function requireConnectionString(
  name: "DATABASE_URL" | "DIRECT_URL",
  fallback?: string,
): string {
  const connectionString = process.env[name] ?? fallback;

  if (!connectionString) {
    throw new Error(`${name} is required to create a database client`);
  }

  return connectionString;
}

function remember(client: PrismaClient, key: "prisma" | "directPrisma") {
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma[key] = client;
  }

  return client;
}

export function getPrisma(): PrismaClient {
  return (
    globalForPrisma.prisma ??
    remember(
      createPrismaClient(requireConnectionString("DATABASE_URL")),
      "prisma",
    )
  );
}

export function getDirectPrisma(): PrismaClient {
  return (
    globalForPrisma.directPrisma ??
    remember(
      createPrismaClient(
        requireConnectionString("DIRECT_URL", process.env.DATABASE_URL),
      ),
      "directPrisma",
    )
  );
}
