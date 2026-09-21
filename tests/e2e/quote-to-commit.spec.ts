import { expect, test, type Page } from "@playwright/test";

import { HAPPY_PATH, NO_MATCH_REGION } from "./constants";
import {
  fillHappyPathRequirement,
  submitRequirement,
} from "./helpers/requirement-form";
import { signInAsApprover } from "./helpers/session";

function uniqueCompany(label: string): string {
  return `${label} ${crypto.randomUUID().slice(0, 8)}`;
}

async function openQuoteForm(page: Page): Promise<void> {
  await page.goto("/quote");
  await expect(
    page.getByRole("heading", { name: "Request GPU capacity" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit request" }),
  ).toBeEnabled({ timeout: 20_000 });
}

test.describe("Release A quote-to-commit", () => {
  test("unauthenticated /quotes redirects to internal sign-in", async ({
    page,
  }) => {
    await page.goto("/quotes");
    await expect(page).toHaveURL(/\/login\?callbackUrl=.*quotes/);
    await expect(
      page.getByRole("heading", { name: "Sign in to Tatari" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
  });

  test("public confirmation shows a reference and no quote price", async ({
    page,
  }) => {
    const companyName = uniqueCompany("E2E Confirm");
    await openQuoteForm(page);
    await fillHappyPathRequirement(page, companyName);
    await submitRequirement(page);

    const main = page.locator("main");
    await expect(page.getByText(/REQ-[A-Z0-9]{8}/)).toBeVisible();
    await expect(main).toContainText(companyName);
    await expect(main).not.toContainText(HAPPY_PATH.expectedTotal);
    await expect(main).not.toContainText("matched");
  });

  test("no-match request appears unmatched and has no quote", async ({
    page,
    context,
    baseURL,
  }) => {
    const companyName = uniqueCompany("E2E No Match");
    await openQuoteForm(page);
    await fillHappyPathRequirement(page, companyName, {
      region: NO_MATCH_REGION,
    });
    const requirementId = await submitRequirement(page);

    await signInAsApprover(context, baseURL ?? "http://127.0.0.1:3100");
    await page.goto("/quotes");
    await expect(
      page.getByRole("heading", { name: "Quote review" }),
    ).toBeVisible();
    await expect(
      page.locator(`a[href="/quotes/${requirementId}"]`),
    ).toBeVisible();
    await page.goto(`/quotes/${requirementId}`);
    await expect(page).toHaveURL(new RegExp(`/quotes/${requirementId}`));
    await expect(page.getByRole("heading", { name: "No quote" })).toBeVisible();
    await expect(page.locator("main")).toContainText(
      "No eligible GPU supply matched this request",
    );
    await expect(page.locator("main")).not.toContainText(
      HAPPY_PATH.expectedTotal,
    );
  });

  test("approver commits a matched quote and cannot approve twice", async ({
    page,
    context,
    baseURL,
  }) => {
    const companyName = uniqueCompany("E2E Commit");
    await openQuoteForm(page);
    await fillHappyPathRequirement(page, companyName);
    const requirementId = await submitRequirement(page);

    await signInAsApprover(context, baseURL ?? "http://127.0.0.1:3100");
    await page.goto("/quotes");
    await expect(
      page.locator(`a[href="/quotes/${requirementId}"]`),
    ).toBeVisible();
    await page.goto(`/quotes/${requirementId}`);
    await expect(page).toHaveURL(new RegExp(`/quotes/${requirementId}`));
    await expect(page.locator("main")).toContainText(
      `$${HAPPY_PATH.expectedTotal}`,
    );

    await page.getByRole("button", { name: "Approve quote" }).click();
    await expect(page.locator("main")).toContainText("Quote approved", {
      timeout: 20_000,
    });
    await expect(page.locator("main")).toContainText("pending delivery");
    await expect(
      page.getByRole("button", { name: "Approve quote" }),
    ).toHaveCount(0);

    await page.reload();
    await expect(page.locator("main")).toContainText("cannot be decided again");

    const approveAgain = page.getByRole("button", { name: "Approve quote" });
    if ((await approveAgain.count()) > 0) {
      await approveAgain.click();
      await expect(page.getByRole("alert")).toContainText("already approved");
    }
  });
});
