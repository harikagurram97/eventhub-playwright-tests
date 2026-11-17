const { test, expect } = require("@playwright/test");

test("patched Bookings Summary and Data Reconciliation", async ({ page }) => {
  let bookingId;
  let oldRef;
  let oldEmail;

  await page.goto("https://eventhub.rahulshettyacademy.com/login");
  await page.locator("#email").fill("eventstest123@gmail.com");
  await page.locator("#password").fill("Test@1234");
  await page.locator("#login-btn").click();
  await expect(page.locator("#nav-bookings")).toBeVisible();

  await page.route("**/api/bookings**", async (route) => {
    const response = await route.fetch();
    const body = await response.json();

    if (bookingId === undefined) {
      bookingId = body.data[0].id;
      oldRef = body.data[0].bookingRef;
      oldEmail = body.data[0].customerEmail;
    }

    const booking = body.data.find((b) => b.id === bookingId);
    booking.bookingRef = "REF-71288";
    booking.event.title = "world Tech Summit Hyderabad";
    booking.quantity = 3;
    booking.totalPrice = 4000;

    await route.fulfill({ response, json: body });
  });

  await page.locator("#nav-bookings").click();
  await expect(
    page.getByRole("heading", { name: "My Bookings" }),
  ).toBeVisible();

  await expect(page.getByTestId("booking-card").nth(1)).toBeVisible();

  const card = page
    .getByTestId("booking-card")
    .filter({ hasText: "REF-71288" });
  await expect(card).toContainText("world Tech Summit Hyderabad");
  await expect(card).toContainText("3 tickets");
  await expect(card).toContainText("$4,000");

  await expect(page.getByText(oldRef, { exact: true })).toHaveCount(0);
  const otherCard = page
    .getByTestId("booking-card")
    .filter({ hasNotText: "REF-71288" })
    .first();
  await expect(otherCard).not.toContainText("world Tech Summit Hyderabad");

  let realEmail;
  await page.route(`**/api/bookings/${bookingId}*`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();

    realEmail = body.data.customerEmail;
    body.data.bookingRef = "REF-71288";
    body.data.event.title = "world Tech Summit Hyderabad";
    body.data.quantity = 3;
    body.data.totalPrice = 4000;

    await route.fulfill({ response, json: body });
  });

  await card.getByRole("button", { name: "View Details" }).click();
  await expect(page).toHaveURL(
    `https://eventhub.rahulshettyacademy.com/bookings/${bookingId}`,
  );

  await expect(page.locator("main nav")).toContainText("REF-71288");
  await expect(page.locator("main h1")).toHaveText(
    "world Tech Summit Hyderabad",
  );

  const tickets = page.getByText("Tickets", { exact: true }).locator("+ span");
  const totalPaid = page
    .getByText("Total Paid", { exact: true })
    .locator("+ span");
  await expect(tickets).toHaveText("3");
  await expect(totalPaid).toHaveText("$4,000");

  await expect(page.locator("main")).toContainText(realEmail);
  expect(realEmail).toBe(oldEmail);

  await page.locator("#nav-bookings").click();
  const cardAgain = page
    .getByTestId("booking-card")
    .filter({ hasText: "REF-71288" });
  await expect(cardAgain).toContainText("$4,000");
});
