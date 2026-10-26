import { test, expect } from "@playwright/test";

test("Events List Locators and Text Assertions", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("eventstest123@gmail.com");
  await page.getByLabel("Password").fill("Test@1234");
  await page.getByText("Sign In", { exact: true }).click();
  await page.getByRole("link", { name: "Browse Events →" }).click();
  await expect(
    page.getByRole("heading", { name: "Upcoming Events" }),
  ).toBeVisible();

  await page.getByPlaceholder("Search events, venues…").fill("World");
  await page.locator(".w-full").nth(1).selectOption("Conference");
  await page.locator(".w-full").last().selectOption("Hyderabad");
  const eventCards = await page.getByTestId("event-card");
  await eventCards.first().waitFor();
  expect(await eventCards.count()).toBeGreaterThanOrEqual(1);
  const targetCard = eventCards.filter({ hasText: "World Tech Summit" });
  await expect(targetCard).toHaveCount(1);
  const eventTitle = await targetCard.locator("h3").innerText();
  expect(eventTitle).toBe("World Tech Summit");
  const price = await targetCard.locator("p").innerText();
  expect(price).toContain("$");
  const seats = (await targetCard.locator("span").last().innerText()).split(
    " ",
  );
  expect(parseInt(seats[0])).toBeGreaterThan(1);
  await targetCard.getByTestId("book-now-btn").click();
  await expect(page).toHaveURL(/\/events/);
  await expect(
    page.getByRole("heading", { name: "World Tech Summit" }),
  ).toHaveText(eventTitle);

  await expect(page.locator("p").filter({ hasText: "$1,500" })).toHaveText(
    price,
  );
  await page.goBack();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await eventCards.first().waitFor();
  expect(await eventCards.count()).toBeGreaterThanOrEqual(3);
  const cardTitles = await eventCards.locator("h3").allInnerTexts();
  for (const title of cardTitles) {
    expect(title.trim()).not.toBe("");
  }
  expect(cardTitles[0].trim()).not.toBe(
    cardTitles[cardTitles.length - 1].trim(),
  );
});
