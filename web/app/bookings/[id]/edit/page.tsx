import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookingForm } from "@/components/BookingForm";
import { getBooking } from "@/lib/api";
import { updateBooking } from "../../actions";

export const metadata: Metadata = { title: "Edit booking" };

export default function EditBookingPage({ params }: PageProps<"/bookings/[id]/edit">) {
  return (
    <>
      <p className="eyebrow">Workshop</p>
      <h1>Edit booking</h1>
      <Suspense fallback={<p aria-busy="true">Loading booking…</p>}>
        <EditForm params={params} />
      </Suspense>
    </>
  );
}

async function EditForm({ params }: { params: PageProps<"/bookings/[id]/edit">["params"] }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  return (
    <BookingForm
      action={updateBooking.bind(null, booking.id)}
      booking={booking}
      submitLabel="Save changes"
      cancelHref={`/bookings/${booking.id}`}
    />
  );
}
