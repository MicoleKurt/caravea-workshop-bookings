"use client";

export default function BookingsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <p>The bookings could not be loaded. Check that the Laravel API is running, then try again.</p>
      {error.digest && <p className="hint">Reference: {error.digest}</p>}
      <button type="button" className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
