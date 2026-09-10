import { z } from "zod";

import { compareDecimalStrings, DecimalStringSchema } from "./money";

export const SUPPLY_STATUSES = [
  "available",
  "unavailable",
  "reserved",
] as const;

export const SUPPLY_SOURCE_TYPES = ["seed", "manual"] as const;

type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

const utcDateTimeSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const positiveDecimalSchema = DecimalStringSchema.refine(
  (value) => compareDecimalStrings(value, "0") > 0,
  "Amount must be greater than zero",
);

export const GpuSupplySchema = z
  .strictObject({
    id: z.string().trim().min(1),
    vendorId: z.string().trim().min(1),
    gpuModel: z.string().trim().min(1).max(80),
    quantityAvailable: z.int().min(1).max(100_000),
    region: z.string().trim().min(1).max(100),
    hourlyPriceUsd: positiveDecimalSchema,
    minimumUptimeBps: z.int().min(1).max(10_000),
    availableFrom: utcDateTimeSchema,
    availableUntil: utcDateTimeSchema,
    status: z.enum(SUPPLY_STATUSES),
    sourceType: z.enum(SUPPLY_SOURCE_TYPES),
    isTestData: z.boolean(),
    sourceReference: z.string().trim().min(1).max(500).optional(),
    lastVerifiedAt: utcDateTimeSchema.optional(),
    metadata: z.record(z.string(), JsonValueSchema).optional(),
  })
  .superRefine((supply, context) => {
    if (supply.availableFrom >= supply.availableUntil) {
      context.addIssue({
        code: "custom",
        message: "Availability end must be after availability start",
        path: ["availableUntil"],
      });
    }
  });

export type GpuSupplyInput = z.input<typeof GpuSupplySchema>;
export type GpuSupply = z.output<typeof GpuSupplySchema>;
