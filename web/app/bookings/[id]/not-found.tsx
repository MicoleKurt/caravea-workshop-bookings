import Link from "next/link";

export default function BookingNotFound() {
  return (
    <>
      <h1>Booking not found</h1>
      <p>That booking does not exist, or it was removed.</p>
      <p>
        <Link href="/bookings" className="button primary">
          Back to bookings
        </Link>
      </p>
    </>
  );
}
