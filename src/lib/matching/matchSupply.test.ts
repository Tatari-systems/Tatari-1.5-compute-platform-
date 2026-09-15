import { describe, expect, it } from "vitest";

import { matchSupply } from "@/lib/matching/matchSupply";
import { ClientRequirementSchema, GpuSupplySchema } from "@/lib/validation";
import { seedGpuSupplies } from "../../../prisma/seed-data";
import { validRequirementInput } from "@/test/fixtures/marketplace";

const requirement = ClientRequirementSchema.parse(validRequirementInput);
const supplies = seedGpuSupplies.map((supply) => GpuSupplySchema.parse(supply));

describe("matchSupply", () => {
  it("returns the full Europe H100 match first", () => {
    const matches = matchSupply(requirement, supplies);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.supply.id).toBe("00000000-0000-4000-8000-000000000001");
    expect(matches[0]?.score).toBe(1);
    expect(matches[0]?.price.totalEstimatedCostUsd).toBe("8131.20");
  });

  it("still matches when nice-to-haves are missing", () => {
    const matches = matchSupply(
      { ...requirement, niceToHaves: [{ key: "cooling", value: "liquid" }] },
      supplies,
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]?.score).toBe(0);
  });

  it("returns no matches when every candidate fails a hard filter", () => {
    expect(
      matchSupply({ ...requirement, region: "ap-south" }, supplies),
    ).toEqual([]);
  });

  it("does not wipe eligible supply when must-haves are empty", () => {
    const matches = matchSupply({ ...requirement, mustHaves: [] }, supplies);

    expect(matches.map((match) => match.supply.id)).toEqual([
      "00000000-0000-4000-8000-000000000001",
    ]);
  });

  it("treats flexible GPU model as a non-blocking preference", () => {
    const matches = matchSupply(
      { ...requirement, gpuModel: "flexible" },
      supplies,
    );

    expect(matches.map((match) => match.supply.gpuModel).sort()).toEqual([
      "A100",
      "H100",
    ]);
  });

  it("rejects supply that would exceed the maximum budget", () => {
    expect(
      matchSupply({ ...requirement, budgetMaxUsd: "100.00" }, supplies),
    ).toEqual([]);
  });
});
