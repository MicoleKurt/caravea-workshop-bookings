/*
 * Times are stored and shown in UTC in this demo. A real dealer product would
 * keep UTC in the database and format in the dealership's own time zone.
 */
const full = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dayLabel = new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }); // YYYY-MM-DD
const clock = new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false });

export const formatInstant = (iso: string) => `${full.format(new Date(iso))} UTC`;

/** "Monday 9 November" */
export const formatDay = (iso: string) => dayLabel.format(new Date(iso));

/** Stable key for grouping by UTC calendar day. */
export const dayOf = (iso: string) => dayKey.format(new Date(iso));

/** "08:00 to 10:00" */
export const formatRange = (start: string, end: string) => `${clock.format(new Date(start))}–${clock.format(new Date(end))}`;

/** ISO instant -> value for <input type="datetime-local"> (UTC wall clock). */
export const toInputValue = (iso: string) => iso.slice(0, 16);

/** <input type="datetime-local"> value -> ISO instant in UTC. */
export const fromInputValue = (value: string) => (value ? `${value}:00+00:00` : "");
