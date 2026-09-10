import { describe, expect, it } from "vitest";

import { seedGpuSupplies } from "../../../prisma/seed-data";
import { GpuSupplySchema } from "@/lib/validation";

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
