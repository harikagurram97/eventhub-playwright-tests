import { test, expect } from "@playwright/test";

test("Login Smoke Test", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle(/^EventHub/);
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("Fixtures to open Login Page", async ({ page, browser }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("beginner@sample.com");
  await expect(page.getByLabel("Email")).toHaveValue("beginner@sample.com");
  const isolatedBrowserContext = await browser.newContext();
  const isolatedPage = await isolatedBrowserContext.newPage();

  //await isolatedPage.goto(`https://eventhub.rahulshettyacademy.com/login`);
  await isolatedPage.goto("/login");
  await expect(
    isolatedPage.getByRole("heading", { name: "Sign in to EventHub" }),
  ).toBeVisible();

  await expect(isolatedPage.getByLabel("Email")).toHaveValue("");
  await isolatedBrowserContext.close();
});
