const { test, expect, request } = require("@playwright/test");

const BASE_URL = "https://eventhub.rahulshettyacademy.com";
const API_URL = "https://api.eventhub.rahulshettyacademy.com/api";

const loginPayload = {
  email: "eventstest123@gmail.com",
  password: "Test@1234",
};

test("Booking Reference API UI Cancel Cleanup", async ({ page }) => {
  const api = await request.newContext();

  const loginResponse = await api.post(`${API_URL}/auth/login`, {
    data: loginPayload,
  });

  expect(loginResponse.ok()).toBeTruthy();

  const loginResponseJson = await loginResponse.json();
  const token = loginResponseJson.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const eventsResponse = await api.get(`${API_URL}/events`, {
    headers: authHeaders,
  });
  expect(eventsResponse.ok()).toBeTruthy();

  const eventsJson = await eventsResponse.json();
  const events = eventsJson.data;
  expect(events.length).toBeGreaterThan(0);

  let selectedEvent = null;
  for (let i = 0; i < events.length; i++) {
    const currentEvent = events[i];
    const isBookable = new Date(currentEvent.eventDate) > new Date();
    if (isBookable && currentEvent.availableSeats >= 2) {
      selectedEvent = currentEvent;
      break;
    }
  }
  expect(selectedEvent).not.toBeNull();
  const eventId = selectedEvent.id;
  const eventTitle = selectedEvent.title;
  const eventCategory = selectedEvent.category;
  const eventCity = selectedEvent.city;
  const eventPrice = Number(selectedEvent.price);
  const total = eventPrice * 2;

  const createBooking = await api.post(`${API_URL}/bookings`, {
    headers: authHeaders,
    data: {
      eventId: eventId,
      quantity: 2,
      customerName: "Test User",
      customerEmail: "test.user@example.com",
      customerPhone: "9876543210",
    },
  });
  expect(createBooking.ok()).toBeTruthy();
  const booking = (await createBooking.json()).data;

  expect(booking.id).toBeTruthy();
  expect(booking.bookingRef).toBeTruthy();
  const bookingId = booking.id;
  const ref = booking.bookingRef;

  const found = (
    await (
      await api.get(`${API_URL}/bookings/ref/${ref}`, { headers: authHeaders })
    ).json()
  ).data;
  expect(found.id).toBe(bookingId);
  expect(found.bookingRef).toBe(ref);
  expect(found.quantity).toBe(2);
  expect(Number(found.totalPrice)).toBe(total);

  await page.addInitScript(
    (t) => localStorage.setItem("eventhub_token", t),
    token,
  );
  await page.goto(`${BASE_URL}/bookings`);
  const card = page.getByTestId("booking-card").filter({ hasText: ref });

  await expect(card).toContainText(eventTitle);
  await expect(card).toContainText("2");
  await expect(card).toContainText(String(total));

  await card.getByText("View Details").click();
  await expect(page).toHaveURL(new RegExp(`/bookings/${bookingId}`));
  for (const text of [
    ref,
    eventTitle,
    eventCategory,
    eventCity,
    String(total),
    "test.user@example.com",
  ]) {
    await expect(page.locator("body")).toContainText(text);
  }

  const del = await api.delete(`${API_URL}/bookings/${bookingId}`, {
    headers: authHeaders,
  });
  expect(del.ok()).toBeTruthy();

  const after = await api.get(`${API_URL}/bookings/ref/${ref}`, {
    headers: authHeaders,
  });
  expect(after.status()).toBe(404);

  await page.goto(`${BASE_URL}/bookings`);
  await expect(page.getByText(ref)).toHaveCount(0);

  await api.dispose();
});
