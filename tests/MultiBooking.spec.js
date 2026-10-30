import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("eventstest123@gmail.com");
  await page.getByLabel("Password").fill("Test@1234");
  await page.getByText("Sign In", { exact: true }).click();
  await page.getByRole("link", { name: "Browse Events →" }).click();
}

async function confirmationPage(page, email) {
  const bookingRef = await page.locator(".booking-ref").innerText();
  const eventTitle = await page.getByRole("heading").first().innerText();
  const detail = (label) =>
    page.locator(`div:has(> span:text-is("${label}")) > span.font-medium`);

  return {
    eventTitle,
    bookingRef,
    ticketCount: await detail("Tickets").textContent(),
    totalText: await detail("Total").textContent(),
    customerEmail: email,
  };
}

test("Multi Booking History and Data Reconciliation", async ({ page }) => {
  await login(page);
  await page.getByPlaceholder("Search events, venues…").fill("World");
  await page.locator(".w-full").nth(1).selectOption("Conference");
  await page.locator(".w-full").last().selectOption("Hyderabad");
  const eventCards = page.getByTestId("event-card");
  await eventCards.first().waitFor();
  const targetCard = eventCards.filter({ hasText: "World Tech Summit" });
  await targetCard.getByRole("link", { name: "Book Now" }).click();
  await page.getByLabel("Full Name").fill("Test Customer");
  await page.getByLabel("Email").fill("eventstest123@gmail.com");
  await page.getByLabel("Phone Number").fill("+91 9876543210");
  await page.getByRole("button", { name: "Confirm Booking" }).click();
  const firstBookingEmail = await page.getByLabel("Email").inputValue();
  const firstBooking = await confirmationPage(page, firstBookingEmail);
  expect(firstBooking.eventTitle).toBe("World Tech Summit");
  expect(firstBooking.bookingRef).not.toBe("");
  expect(firstBooking.ticketCount).toBe("1");

  await page.goto("/events");
  await page.getByPlaceholder("Search events, venues…").fill("Dilli");
  await page.locator(".w-full").nth(1).selectOption("Festival");
  await page.locator(".w-full").last().selectOption("Delhi");
  const dilliCard = eventCards.filter({ hasText: "Dilli Diwali Mela" });
  await expect(dilliCard).toHaveCount(1);
  await dilliCard.getByRole("link", { name: "Book Now" }).click();
  await page.getByRole("button", { name: "+" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Full Name").fill("Test Customer");
  await page.getByLabel("Email").fill("eventstest123@gmail.com");
  await page.getByLabel("Phone Number").fill("+91 9876543210");
  const secondBookingEmail = await page.getByLabel("Email").inputValue();
  await page.getByRole("button", { name: "Confirm Booking" }).click();
  const secondBooking = await confirmationPage(page, secondBookingEmail);
  expect(secondBooking.bookingRef).not.toBe(firstBooking.bookingRef);
  expect(secondBooking.eventTitle).not.toBe(firstBooking.eventTitle);
  expect(secondBooking.ticketCount).toBe("2");
  await page.getByTestId("nav-bookings").click();
  const bookingCards = page.getByTestId("booking-card");
  const bookings = [
    {
      payload: firstBooking,
      card: bookingCards.filter({ hasText: firstBooking.bookingRef }),
    },
    {
      payload: secondBooking,
      card: bookingCards.filter({ hasText: secondBooking.bookingRef }),
    },
  ];

  for (const { payload, card } of bookings) {
    await expect(card).toHaveCount(1);
    await expect(card).toBeVisible();
    await expect(card.getByText("confirmed")).toBeVisible();

    await expect(card).toContainText(payload.eventTitle);
    await expect(card).toContainText(payload.ticketCount);
    await expect(card).toContainText(payload.totalText);
  }

  await bookings[0].card.getByRole("button", { name: "View Details" }).click();
  await expect(
    page.locator("nav").getByText(firstBooking.bookingRef, { exact: true }),
  ).toBeVisible();

  const rowValue = (label) =>
    page.locator(`div:has(> span:text-is("${label}")) > span`).last();

  await expect(page.locator("h1")).toHaveText(firstBooking.eventTitle);
  await expect(rowValue("Email")).toHaveText(firstBooking.customerEmail);

  await expect(rowValue("Tickets")).toHaveText(firstBooking.ticketCount);
  await expect(rowValue("Total Paid")).toHaveText(firstBooking.totalText);

  await expect(rowValue("Booking ID")).toHaveText(/^#\d+$/);

  await page.getByTestId("nav-bookings").click();
  const secondCard = bookingCards.filter({ hasText: secondBooking.bookingRef });
  await expect(secondCard).toHaveCount(1);
  await secondCard.getByRole("link", { name: /view|details/i }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    secondBooking.eventTitle,
  );
  await expect(rowValue("Tickets")).toHaveText("2");
  await expect(rowValue("Total Paid")).toHaveText(secondBooking.totalText);

  await expect(page.locator("body")).not.toContainText(firstBooking.bookingRef);
});
