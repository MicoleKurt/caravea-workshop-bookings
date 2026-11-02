import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getBookings } from "@/lib/api";
import { STATUSES } from "@/lib/types";
import { formatInstant } from "@/lib/format";

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

  return (
    <>
      <nav aria-label="Filter by status" className="filters">
        {["", ...STATUSES].map((value) => (
          <Link key={value || "all"} href={href(value, 1)} aria-current={value === status ? "page" : undefined} className="chip">
            {value || "all"}
          </Link>
        ))}
      </nav>

      {bookings.length === 0 ? (
        <p className="empty">No bookings{status ? ` with status “${status}”` : ""} on this page.</p>
      ) : (
        <ul className="cards">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link href={`/bookings/${booking.id}`} className="card">
                <span className="card-title">
                  {booking.customer_name} <span className="rego">{booking.rego}</span>
                </span>
                <span className="card-meta">
                  Bay {booking.service_bay} · {formatInstant(booking.starts_at)} to {formatInstant(booking.ends_at)}
                </span>
                <span className={`status status-${booking.status}`}>{booking.status}</span>
              </Link>
            </li>
          ))}
        </ul>
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
        <span className="chip skeleton">all</span>
      </div>
      <ul className="cards">
        {[1, 2, 3].map((n) => (
          <li key={n} className="card skeleton-card" />
        ))}
      </ul>
    </div>
  );
}
