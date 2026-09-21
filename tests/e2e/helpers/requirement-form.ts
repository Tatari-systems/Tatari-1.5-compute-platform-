import { expect, type Page } from "@playwright/test";

import { HAPPY_PATH } from "../constants";

export async function fillHappyPathRequirement(
  page: Page,
  companyName: string,
  options?: { region?: string },
): Promise<void> {
  await page.getByLabel("Contact name").fill(HAPPY_PATH.contactName);
  await page.getByLabel("Contact email").fill(HAPPY_PATH.contactEmail);
  await page.getByLabel("Company name").fill(companyName);
  await page.getByLabel("Workload type").selectOption("AI training");
  await page.getByLabel("GPU preference").fill(HAPPY_PATH.gpuModel);
  await page.getByLabel("Quantity").fill(HAPPY_PATH.quantity);
  await page.getByLabel("Region").fill(options?.region ?? HAPPY_PATH.region);
  await page.getByLabel("Start").fill(HAPPY_PATH.timeframeStart);
  await page.getByLabel("End").fill(HAPPY_PATH.timeframeEnd);
  await page.getByLabel("Budget minimum (USD)").fill(HAPPY_PATH.budgetMinUsd);
  await page.getByLabel("Budget maximum (USD)").fill(HAPPY_PATH.budgetMaxUsd);
  await page.getByLabel("Minimum uptime").selectOption("99.9%");
  await expect(page.getByLabel("Company name")).toHaveValue(companyName);
}

export async function submitRequirement(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Submit request" }).click();
  await page.waitForURL(/\/quote\/confirmation\//, { timeout: 30_000 });
  const match = page.url().match(/\/quote\/confirmation\/([^/?#]+)/);
  const requirementId = match?.[1];

  if (!requirementId) {
    throw new Error(`Confirmation URL was missing an id: ${page.url()}`);
  }

  return requirementId;
}
