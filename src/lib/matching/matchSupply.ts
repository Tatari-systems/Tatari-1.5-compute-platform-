import type { GpuSupply, RequirementCriterion } from "@/lib/validation";

import { isWithinBudget, priceQuote, type QuotePrice } from "./pricing";

export type MatchRequirement = {
  gpuModel: string;
  quantity: number;
  region: string;
  timeframeStart: Date;
  timeframeEnd: Date;
  budgetMaxUsd: string;
  minimumUptimeBps: number;
  mustHaves: RequirementCriterion[];
  niceToHaves: RequirementCriterion[];
};

export type RankedMatch = {
  supply: GpuSupply;
  score: number;
  price: QuotePrice;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function metadataValue(
  metadata: GpuSupply["metadata"],
  key: string,
): string | undefined {
  if (!metadata || !(key in metadata)) {
    return undefined;
  }

  const value = metadata[key];
  if (value === null || value === undefined) {
    return undefined;
  }

  return String(value);
}

function criterionMatches(
  supply: GpuSupply,
  criterion: RequirementCriterion,
): boolean {
  const actual = metadataValue(supply.metadata, criterion.key);
  return (
    actual !== undefined && normalize(actual) === normalize(criterion.value)
  );
}

function passesMustHaves(
  requirement: MatchRequirement,
  supply: GpuSupply,
): boolean {
  return requirement.mustHaves.every((criterion) =>
    criterionMatches(supply, criterion),
  );
}

function niceToHaveScore(
  requirement: MatchRequirement,
  supply: GpuSupply,
): number {
  return requirement.niceToHaves.filter((criterion) =>
    criterionMatches(supply, criterion),
  ).length;
}

function isEligible(requirement: MatchRequirement, supply: GpuSupply): boolean {
  if (supply.status !== "available") {
    return false;
  }

  if (
    normalize(requirement.gpuModel) !== "flexible" &&
    normalize(supply.gpuModel) !== normalize(requirement.gpuModel)
  ) {
    return false;
  }

  if (normalize(supply.region) !== normalize(requirement.region)) {
    return false;
  }

  if (supply.quantityAvailable < requirement.quantity) {
    return false;
  }

  if (supply.availableFrom > requirement.timeframeStart) {
    return false;
  }

  if (supply.availableUntil < requirement.timeframeEnd) {
    return false;
  }

  if (supply.minimumUptimeBps < requirement.minimumUptimeBps) {
    return false;
  }

  if (!passesMustHaves(requirement, supply)) {
    return false;
  }

  const price = priceQuote({
    hourlyPriceUsd: supply.hourlyPriceUsd,
    quantity: requirement.quantity,
    timeframeStart: requirement.timeframeStart,
    timeframeEnd: requirement.timeframeEnd,
  });

  return isWithinBudget(price.totalEstimatedCostUsd, requirement.budgetMaxUsd);
}

export function matchSupply(
  requirement: MatchRequirement,
  supplyList: readonly GpuSupply[],
): RankedMatch[] {
  return supplyList
    .filter((supply) => isEligible(requirement, supply))
    .map((supply) => ({
      supply,
      score: niceToHaveScore(requirement, supply),
      price: priceQuote({
        hourlyPriceUsd: supply.hourlyPriceUsd,
        quantity: requirement.quantity,
        timeframeStart: requirement.timeframeStart,
        timeframeEnd: requirement.timeframeEnd,
      }),
    }))
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      const priceOrder =
        left.price.totalEstimatedCostUsd === right.price.totalEstimatedCostUsd
          ? 0
          : left.price.totalEstimatedCostUsd < right.price.totalEstimatedCostUsd
            ? -1
            : 1;

      if (priceOrder !== 0) {
        return priceOrder;
      }

      return left.supply.id.localeCompare(right.supply.id);
    });
}
