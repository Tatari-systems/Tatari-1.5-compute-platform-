import type {
  ClientRequirementInput,
  CreateQuoteCommandInput,
  GpuSupplyInput,
} from "@/lib/validation";

export const validRequirementInput = {
  contactName: "Amina Researcher",
  contactEmail: "amina@example.com",
  companyName: "Example AI Lab",
  companyWebsite: "https://example.com",
  workloadType: "ai_training",
  gpuModel: "H100",
  quantity: 8,
  region: "eu-west",
  timeframeStart: "2026-10-01T00:00:00Z",
  timeframeEnd: "2026-10-15T00:00:00Z",
  budgetMinUsd: "10000.00",
  budgetMaxUsd: "30000.00",
  minimumUptimeBps: 9990,
  slaNotes: "Workload must survive a single host failure",
  mustHaves: [{ key: "minimum_vram_gb", value: "80" }],
  niceToHaves: [{ key: "interconnect", value: "nvlink" }],
  additionalNotes: "Training data is already hosted in Europe.",
} satisfies ClientRequirementInput;

export const validSupplyInput = {
  id: "supply_eu_h100_01",
  vendorId: "vendor_demo_01",
  gpuModel: "H100",
  quantityAvailable: 16,
  region: "eu-west",
  hourlyPriceUsd: "2.750000",
  minimumUptimeBps: 9990,
  availableFrom: "2026-09-01T00:00:00Z",
  availableUntil: "2026-12-31T23:59:59Z",
  status: "available",
  sourceType: "seed",
  isTestData: true,
  sourceReference: "release-a-seed",
  lastVerifiedAt: "2026-09-10T12:00:00Z",
  metadata: { interconnect: "nvlink", vramGb: 80 },
} satisfies GpuSupplyInput;

export const validQuoteInput = {
  requirementId: "requirement_01",
  expiresAt: "2026-09-17T12:00:00Z",
  lineItems: [
    {
      supplyId: validSupplyInput.id,
      vendorId: validSupplyInput.vendorId,
      gpuModel: validSupplyInput.gpuModel,
      region: validSupplyInput.region,
      quantity: 8,
      hourlyPriceUsd: "2.750000",
      billableHours: 336,
      supplierSubtotalUsd: "7392.00",
      marginBps: 1000,
      platformFeeUsd: "739.20",
      totalEstimatedCostUsd: "8131.20",
      minimumUptimeBps: 9990,
    },
  ],
} satisfies CreateQuoteCommandInput;
