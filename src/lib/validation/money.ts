import { z } from "zod";

const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;

export const DecimalStringSchema = z
  .string()
  .trim()
  .regex(
    decimalPattern,
    "Enter a non-negative decimal amount with no more than 6 decimal places",
  );

export const UsdAmountSchema = z
  .string()
  .trim()
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "Enter a non-negative USD amount with no more than 2 decimal places",
  );

function decimalParts(value: string): [whole: bigint, fraction: string] {
  const [whole, fraction = ""] = value.split(".");
  return [BigInt(whole), fraction];
}

export function compareDecimalStrings(left: string, right: string): number {
  const [leftWhole, leftFraction] = decimalParts(left);
  const [rightWhole, rightFraction] = decimalParts(right);

  if (leftWhole !== rightWhole) {
    return leftWhole < rightWhole ? -1 : 1;
  }

  const scale = Math.max(leftFraction.length, rightFraction.length);
  const normalizedLeft = BigInt(leftFraction.padEnd(scale, "0") || "0");
  const normalizedRight = BigInt(rightFraction.padEnd(scale, "0") || "0");

  if (normalizedLeft === normalizedRight) {
    return 0;
  }

  return normalizedLeft < normalizedRight ? -1 : 1;
}
