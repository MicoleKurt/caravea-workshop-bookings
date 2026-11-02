import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getBookings } from "@/lib/api";
import { STATUSES } from "@/lib/types";
import { dayOf, formatDay, formatRange } from "@/lib/format";
import type { Booking } from "@/lib/types";

export const metadata: Metadata = { title: "Bookings" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * The page shell is static. Reading searchParams is request-time, so that part
 * lives in <BookingList> behind a Suspense boundary and streams in; the shell
 * and the filter bar appear immediately.
 */
export default function BookingsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <p className="eyebrow">Service bays 1–6</p>
      <h1>Bookings</h1>
      <Suspense fallback={<ListSkeleton />}>
        <BookingList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function href(status: string, page: number) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/bookings?${text}` : "/bookings";
}

async function BookingList({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // The URL is the state. Anything unexpected falls back to the default view.
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = (STATUSES as readonly string[]).includes(rawStatus) ? rawStatus : "";
  const rawPage = Number.parseInt(typeof params.page === "string" ? params.page : "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const { data: bookings, meta } = await getBookings(status, page);

  // A page past the end (a stale link, or the last item was removed) goes to the real last page.
  if (page > meta.last_page && meta.last_page >= 1) redirect(href(status, meta.last_page));

  // The API already sorts by start time, so grouping is a single pass.
  const days: { key: string; label: string; items: Booking[] }[] = [];
  for (const booking of bookings) {
    const key = dayOf(booking.starts_at);
    const last = days.at(-1);
    if (last?.key === key) last.items.push(booking);
    else days.push({ key, label: formatDay(booking.starts_at), items: [booking] });
  }

  return (
    <>
      <nav aria-label="Filter by status" className="filters">
        {["", ...STATUSES].map((value) => (
          <Link key={value || "all"} href={href(value, 1)} aria-current={value === status ? "page" : undefined} className="filter">
            {value || "all"}
          </Link>
        ))}
      </nav>

      {days.length === 0 ? (
        <p className="empty">No bookings{status ? ` with status “${status}”` : ""} on this page.</p>
      ) : (
        days.map((day) => (
          <section key={day.key} className="day" aria-labelledby={`day-${day.key}`}>
            <h2 id={`day-${day.key}`} className="day-title">
              {day.label}
            </h2>
            <ul className="rows">
              {day.items.map((booking) => (
                <li key={booking.id}>
                  <Link href={`/bookings/${booking.id}`} className="row-link">
                    <span className="time">{formatRange(booking.starts_at, booking.ends_at)}</span>
                    <span className="who">
                      <span className="who-name">{booking.customer_name}</span>
                      {booking.notes && <span className="who-note">{booking.notes}</span>}
                    </span>
                    <span className="plate" aria-label={`Registration ${booking.rego}`}>
                      {booking.rego}
                    </span>
                    <span className="bay">
                      <span className="bay-label">Bay</span> {booking.service_bay}
                    </span>
                    <span className={`state state-${booking.status}`}>{booking.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <nav aria-label="Pagination" className="pagination">
        {meta.current_page > 1 ? <Link href={href(status, meta.current_page - 1)}>← Previous</Link> : <span />}
        <span>
          Page {meta.current_page} of {meta.last_page} · {meta.total} booking{meta.total === 1 ? "" : "s"}
        </span>
        {meta.current_page < meta.last_page ? <Link href={href(status, meta.current_page + 1)}>Next →</Link> : <span />}
      </nav>
    </>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading bookings">
      <div className="filters">
        <span className="filter skeleton-text">all</span>
      </div>
      <ul className="rows">
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className="row-link skeleton-row" />
        ))}
      </ul>
    </div>
  );
}
