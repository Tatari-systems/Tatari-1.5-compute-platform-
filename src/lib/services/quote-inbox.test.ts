import { Prisma } from "@/generated/prisma/client";
import { describe, expect, it } from "vitest";

import { listQuoteInbox } from "./quote-inbox";

const pendingId = "11111111-1111-4111-8111-111111111111";
const approvedId = "22222222-2222-4222-8222-222222222222";
const noMatchId = "33333333-3333-4333-8333-333333333333";

describe("listQuoteInbox", () => {
  it("groups pending quotes, decided quotes, and unmatched requests", async () => {
    const inbox = await listQuoteInbox({
      prisma: {
        quote: {
          findMany: async () => [
            {
              id: "quote-approved",
              status: "approved",
              totalEstimatedCostUsd: new Prisma.Decimal("8131.20"),
              expiresAt: new Date("2026-09-21T00:00:00.000Z"),
              createdAt: new Date("2026-09-14T12:00:00.000Z"),
              requirement: {
                id: approvedId,
                contactName: "Ana",
                companyName: "Northwind",
                gpuModel: "H100",
                quantity: 8,
                region: "eu-west",
                createdAt: new Date("2026-09-14T11:00:00.000Z"),
              },
            },
            {
              id: "quote-pending",
              status: "pending_approval",
              totalEstimatedCostUsd: new Prisma.Decimal("1200.00"),
              expiresAt: new Date("2026-09-22T00:00:00.000Z"),
              createdAt: new Date("2026-09-15T12:00:00.000Z"),
              requirement: {
                id: pendingId,
                contactName: "Ben",
                companyName: "Contoso",
                gpuModel: "A100",
                quantity: 4,
                region: "us-east",
                createdAt: new Date("2026-09-15T11:00:00.000Z"),
              },
            },
          ],
        },
        clientRequirement: {
          findMany: async () => [
            {
              id: noMatchId,
              contactName: "Cara",
              companyName: "Fabrikam",
              gpuModel: "H100",
              quantity: 64,
              region: "ap-southeast",
              createdAt: new Date("2026-09-16T11:00:00.000Z"),
            },
          ],
        },
      },
    });

    expect(inbox.pending).toEqual([
      expect.objectContaining({
        requirementId: pendingId,
        reference: "REQ-11111111",
        companyName: "Contoso",
        quote: expect.objectContaining({
          status: "pending_approval",
          totalEstimatedCostUsd: "1200.00",
        }),
      }),
    ]);
    expect(inbox.decided[0]?.requirementId).toBe(approvedId);
    expect(inbox.noMatch).toEqual([
      expect.objectContaining({
        requirementId: noMatchId,
        quote: null,
        region: "ap-southeast",
      }),
    ]);
  });
});
