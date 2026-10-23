import { test, expect } from "@playwright/test";

test("Eventhub Login", async ({ page }) => {
  await page.goto("https://eventhub.rahulshettyacademy.com/login");
  await expect(
    page.getByRole("heading", { name: "Sign in to EventHub" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("you@email.com")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
});
