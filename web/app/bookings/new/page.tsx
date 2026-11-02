import type { Metadata } from "next";
import { BookingForm } from "@/components/BookingForm";
import { createBooking } from "../actions";

export const metadata: Metadata = { title: "New booking" };

export default function NewBookingPage() {
  return (
    <>
      <h1>New booking</h1>
      <BookingForm action={createBooking} submitLabel="Create booking" cancelHref="/bookings" />
    </>
  );
}
