import { describe, expect, it } from "vitest";

import { seedGpuSupplies, seedInternalUsers } from "../../../prisma/seed-data";
import { INTERNAL_ROLES } from "@/lib/domain/roles";
import { GpuSupplySchema, InternalUserInputSchema } from "@/lib/validation";

describe("deterministic GPU supply seed", () => {
  it("contains valid, stable, uniquely identified test records", () => {
    const parsed = seedGpuSupplies.map((supply) =>
      GpuSupplySchema.parse(supply),
    );

    expect(new Set(parsed.map((supply) => supply.id)).size).toBe(parsed.length);
    expect(parsed).toHaveLength(6);
    expect(parsed.every((supply) => supply.sourceType === "seed")).toBe(true);
    expect(parsed.every((supply) => supply.isTestData)).toBe(true);
  });

  it("covers the matching and rejection scenarios needed by Release A", () => {
    expect(
      seedGpuSupplies.some(
        (supply) =>
          supply.gpuModel === "H100" &&
          supply.region === "eu-west" &&
          supply.quantityAvailable >= 8 &&
          supply.status === "available" &&
          supply.availableUntil >= "2026-10-15T00:00:00Z",
      ),
    ).toBe(true);
    expect(seedGpuSupplies.some((supply) => supply.region === "us-east")).toBe(
      true,
    );
    expect(seedGpuSupplies.some((supply) => supply.gpuModel === "A100")).toBe(
      true,
    );
    expect(seedGpuSupplies.some((supply) => supply.quantityAvailable < 8)).toBe(
      true,
    );
    expect(
      seedGpuSupplies.some(
        (supply) => supply.availableUntil < "2026-10-15T00:00:00Z",
      ),
    ).toBe(true);
    expect(
      seedGpuSupplies.some((supply) => supply.status === "unavailable"),
    ).toBe(true);
  });
});

describe("deterministic internal user seed", () => {
  it("contains valid, stable, uniquely identified staff accounts", () => {
    const parsed = seedInternalUsers.map((user) =>
      InternalUserInputSchema.parse(user),
    );

    expect(parsed).toHaveLength(3);
    expect(new Set(parsed.map((user) => user.id)).size).toBe(parsed.length);
    expect(new Set(parsed.map((user) => user.email)).size).toBe(parsed.length);
    expect(parsed.every((user) => user.isActive)).toBe(true);
  });

  it("covers every internal role without committing real addresses", () => {
    expect(new Set(seedInternalUsers.map((user) => user.role))).toEqual(
      new Set(INTERNAL_ROLES),
    );
    expect(
      seedInternalUsers.every((user) => user.email.endsWith("@example.com")),
    ).toBe(true);
  });
});
