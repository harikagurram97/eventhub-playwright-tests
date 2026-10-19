import { test, expect } from "@playwright/test";

const BASE_URL = "https://eventhub.rahulshettyacademy.com";

test("Eventhub Login", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(
    page.getByRole("heading", { name: "Sign in to EventHub" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("you@email.com")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
});
