import { cacheLife, cacheTag } from "next/cache";
import type { Booking, BookingPage } from "./types";

/** Base URL of the Laravel API (server-side only). */
export const API_URL = process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api";

const headers = { Accept: "application/json" };

/**
 * Reads are cached and tagged. A mutation calls updateTag("bookings") (list)
 * and updateTag(`booking-${id}`) (detail) so the next render fetches fresh data.
 * Page and filter are arguments, so each combination gets its own cache entry.
 */
export async function getBookings(status: string, page: number): Promise<BookingPage> {
  "use cache";
  cacheTag("bookings");
  cacheLife("minutes");

  const query = new URLSearchParams({ page: String(page) });
  if (status) query.set("status", status);

  const res = await fetch(`${API_URL}/bookings?${query}`, { headers });
  if (!res.ok) throw new Error(`The bookings API answered ${res.status}.`);
  return res.json();
}

/** Returns null when the booking does not exist, so the page can show a real 404. */
export async function getBooking(id: string): Promise<Booking | null> {
  "use cache";
  cacheTag("bookings", `booking-${id}`);
  cacheLife("minutes");

  if (!/^\d+$/.test(id)) return null;

  const res = await fetch(`${API_URL}/bookings/${id}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`The bookings API answered ${res.status}.`);
  return (await res.json()).data;
}
