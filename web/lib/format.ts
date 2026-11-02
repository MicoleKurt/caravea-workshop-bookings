/*
 * Times are stored and shown in UTC in this demo. A real dealer product would
 * keep UTC in the database and format in the dealership's own time zone.
 */
const display = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatInstant = (iso: string) => `${display.format(new Date(iso))} UTC`;

/** ISO instant -> value for <input type="datetime-local"> (UTC wall clock). */
export const toInputValue = (iso: string) => iso.slice(0, 16);

/** <input type="datetime-local"> value -> ISO instant in UTC. */
export const fromInputValue = (value: string) => (value ? `${value}:00+00:00` : "");
