import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("eventstest123@gmail.com");
  await page.getByLabel("Password").fill("Test@1234");
  await page.getByText("Sign In", { exact: true }).click();
  await page.getByRole("link", { name: "Browse Events →" }).click();
}

const formatPrice = (amount) => `$${Number(amount).toLocaleString("en-US")}`;

const mockEventsResponse = {
  data: [
    {
      id: 1,
      title: "AI & Cloud Tech Summit 2025",
      category: "Conference",
      eventDate: "2025-07-10T04:30:00.000Z",
      venue: "HICC Novotel",
      city: "Hyderabad",
      price: "2499",
      totalSeats: 300,
      availableSeats: 145,
      imageUrl: null,
      isStatic: false,
    },
    {
      id: 2,
      title: "Delhi Food & Culture Festival",
      category: "Festival",
      eventDate: "2025-08-02T11:00:00.000Z",
      venue: "Jawaharlal Nehru Stadium",
      city: "Delhi",
      price: "799",
      totalSeats: 1000,
      availableSeats: 620,
      imageUrl: null,
      isStatic: false,
    },
    {
      id: 3,
      title: "Arijit Singh Live in Concert",
      category: "Concert",
      eventDate: "2025-09-20T13:30:00.000Z",
      venue: "DY Patil Stadium",
      city: "Mumbai",
      price: "3500",
      totalSeats: 500,
      availableSeats: 12,
      imageUrl: null,
      isStatic: false,
    },
    {
      id: 4,
      title: "Hands-on Playwright Automation Workshop",
      category: "Workshop",
      eventDate: "2025-06-15T03:30:00.000Z",
      venue: "WeWork Embassy Golf Links",
      city: "Bangalore",
      price: "1200",
      totalSeats: 40,
      availableSeats: 25,
      imageUrl: null,
      isStatic: false,
    },
  ],
  pagination: { page: 1, totalPages: 1, total: 4, limit: 12 },
};

test("Mocked Events Catalogue Filter Reconciliation", async ({ page }) => {
  await page.route("**/api/events**", async (route) => {
    const url = new URL(route.request().url());

    const idMatch = url.pathname.match(/\/api\/events\/(\d+)$/);
    if (idMatch) {
      const event = mockEventsResponse.data.find(
        (e) => e.id === Number(idMatch[1]),
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: event }),
      });
    }

    const search = (url.searchParams.get("search") || "").toLowerCase().trim();
    const category = url.searchParams.get("category");
    const city = url.searchParams.get("city");

    const filtered = mockEventsResponse.data.filter((e) => {
      const text =
        `${e.title} ${e.category} ${e.city} ${e.venue}`.toLowerCase();
      const searchOk =
        !search || search.split(" ").every((word) => text.includes(word));
      const categoryOk = !category || e.category === category;
      const cityOk = !city || e.city === city;
      return searchOk && categoryOk && cityOk;
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: filtered,
        pagination: {
          page: 1,
          totalPages: 1,
          total: filtered.length,
          limit: 12,
        },
      }),
    });
  });

  await login(page);
  await expect(
    page.getByRole("heading", { name: "Upcoming Events" }),
  ).toBeVisible();
  const eventCards = await page.getByTestId("event-card");
  await expect(eventCards.first()).toBeVisible();
  expect(await eventCards.count()).toBe(4);

  for (const event of mockEventsResponse.data) {
    const card = eventCards.filter({ hasText: event.title });
    await expect(
      card.getByRole("heading", { name: event.title }),
    ).toBeVisible();

    await expect(
      card.getByText(`$${Number(event.price).toLocaleString("en-US")}`),
    ).toBeVisible();
    await expect(
      card.getByText(`${event.availableSeats} seats available`),
    ).toBeVisible();

    await expect(card.getByRole("link", { name: event.title })).toHaveAttribute(
      "href",
      `/events/${event.id}`,
    );

    await expect(card.getByTestId("book-now-btn")).toHaveAttribute(
      "href",
      `/events/${event.id}`,
    );
  }
  await expect(page.getByText("World Tech Summit")).toHaveCount(0);
  await page
    .getByPlaceholder("Search events, venues…")
    .fill("Hyderabad conference");
  await page.locator(".w-full").nth(1).selectOption("Conference");
  await page.locator(".w-full").last().selectOption("Hyderabad");

  await expect(eventCards).toHaveCount(1);

  const storedRecord = mockEventsResponse.data.find(
    (e) =>
      e.category === "Conference" &&
      e.city === "Hyderabad" &&
      e.title.toLowerCase().includes("summit"),
  );

  await eventCards.getByTestId("book-now-btn").click();

  await expect(
    page.getByText(`$${Number(storedRecord.price).toLocaleString("en-US")}`),
  ).toBeVisible();

  await expect(
    page.getByText(`${storedRecord.venue}, ${storedRecord.city}`),
  ).toBeVisible();

  await expect(
    page.getByText(`${storedRecord.availableSeats} seats available`, {
      exact: true,
    }),
  ).toBeVisible();

  const quantity = page.locator("#ticket-count");
  const plusButton = page.getByRole("button", { name: "+", exact: true });
  const total = page.locator("//span[text()='Total']/following-sibling::span");

  await expect(quantity).toHaveText("1");

  await expect(total).toHaveText(formatPrice(storedRecord.price));

  await plusButton.click();
  await expect(quantity).toHaveText("2");

  await expect(total).toHaveText(formatPrice(Number(storedRecord.price) * 2));
});
