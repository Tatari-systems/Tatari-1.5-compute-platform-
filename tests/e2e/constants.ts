export const E2E_APPROVER = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "e2e.approver@tatari.test",
  displayName: "E2E Approver",
  role: "approver",
} as const;

export const HAPPY_PATH = {
  contactName: "Amina Researcher",
  contactEmail: "amina@example.com",
  gpuModel: "H100",
  quantity: "8",
  region: "eu-west",
  timeframeStart: "2026-10-01T00:00",
  timeframeEnd: "2026-10-15T00:00",
  budgetMinUsd: "10000.00",
  budgetMaxUsd: "30000.00",
  expectedTotal: "8131.20",
} as const;

export const NO_MATCH_REGION = "ap-south";
