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
      <p>
        <Link href="/bookings">← All bookings</Link>
      </p>

      <h1>
        {booking.customer_name} <span className="rego">{booking.rego}</span>
      </h1>
      <p>
        <span className={`status status-${booking.status}`}>{booking.status}</span>
      </p>

      <dl className="details">
        <dt>Email</dt>
        <dd>{booking.customer_email}</dd>
        <dt>Service bay</dt>
        <dd>{booking.service_bay}</dd>
        <dt>Starts</dt>
        <dd>{formatInstant(booking.starts_at)}</dd>
        <dt>Ends</dt>
        <dd>{formatInstant(booking.ends_at)}</dd>
        <dt>Notes</dt>
        <dd>{booking.notes ?? "None"}</dd>
      </dl>

      <div className="actions">
        <Link href={`/bookings/${booking.id}/edit`} className="button primary">
          Edit
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
