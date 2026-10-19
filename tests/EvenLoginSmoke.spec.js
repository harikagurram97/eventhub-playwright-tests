import { test, expect } from "@playwright/test";

const BASE_URL = "https://eventhub.rahulshettyacademy.com";

test("Login Page Smoke Test", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Sign in to EventHub" }),
  ).toBeVisible();
});
