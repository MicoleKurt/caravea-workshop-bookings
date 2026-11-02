import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBooking } from "@/lib/api";
import { formatInstant } from "@/lib/format";
import { cancelBooking } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = { title: "Booking" };

export default function BookingPage({ params }: PageProps<"/bookings/[id]">) {
  return (
    <Suspense fallback={<p aria-busy="true">Loading booking…</p>}>
      <BookingDetail params={params} />
    </Suspense>
  );
}

async function BookingDetail({ params }: { params: PageProps<"/bookings/[id]">["params"] }) {
  const { id } = await params;
  const booking = await getBooking(id);

  // A missing booking is a real 404 (see ./not-found.tsx), not an empty page.
  if (!booking) notFound();

  const cancel = cancelBooking.bind(null, booking.id);

  return (
    <>
      <p className="back">
        <Link href="/bookings">← All bookings</Link>
      </p>

      <p className="eyebrow">Booking {String(booking.id).padStart(4, "0")}</p>
      <h1>{booking.customer_name}</h1>
      <p className="detail-meta">
        <span className="plate plate-lg">{booking.rego}</span>
        <span className={`state state-${booking.status}`}>{booking.status}</span>
      </p>

      <dl className="ledger">
        <div>
          <dt>Service bay</dt>
          <dd>Bay {booking.service_bay}</dd>
        </div>
        <div>
          <dt>Starts</dt>
          <dd>{formatInstant(booking.starts_at)}</dd>
        </div>
        <div>
          <dt>Ends</dt>
          <dd>{formatInstant(booking.ends_at)}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{booking.customer_email}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{booking.notes ?? "None"}</dd>
        </div>
      </dl>

      <div className="actions">
        <Link href={`/bookings/${booking.id}/edit`} className="button primary">
          Edit booking
        </Link>
        {booking.status !== "cancelled" && (
          <form action={cancel}>
            <SubmitButton variant="danger">Cancel booking</SubmitButton>
          </form>
        )}
      </div>
    </>
  );
}
