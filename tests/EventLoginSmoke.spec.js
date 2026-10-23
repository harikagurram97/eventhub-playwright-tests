import { test, expect } from "@playwright/test";

test("Login Page Smoke Test", async ({ page }) => {
  await page.goto("https://eventhub.rahulshettyacademy.com/login");
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Sign in to EventHub" }),
  ).toBeVisible();
});
