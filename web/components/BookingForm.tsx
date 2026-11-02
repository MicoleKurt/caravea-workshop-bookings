"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Booking } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { toInputValue } from "@/lib/format";
import type { FormState } from "@/app/bookings/actions";
import { SubmitButton } from "./SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  booking?: Booking;
  submitLabel: string;
  cancelHref: string;
};

/** A label, its control and that field's own errors, linked with aria-describedby. */
function Field({
  name,
  label,
  hint,
  errors,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  errors: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="field" data-invalid={errors.length > 0 || undefined}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && errors.length === 0 && <p className="hint">{hint}</p>}
      {errors.map((message) => (
        <p key={message} id={`${name}-error`} className="error" role="alert">
          {message}
        </p>
      ))}
    </div>
  );
}

export function BookingForm({ action, booking, submitLabel, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, {});

  /** What a field shows: the last submitted value after an error, else the saved booking. */
  const value = (field: string, saved: string | undefined) => state.values?.[field] ?? saved ?? "";
  const errorsFor = (field: string) => state.errors?.[field] ?? [];

  const control = (name: string) => ({
    id: name,
    name,
    "aria-invalid": errorsFor(name).length > 0 || undefined,
    "aria-describedby": errorsFor(name).length > 0 ? `${name}-error` : undefined,
  });

  return (
    // Remounting the fields after each submit makes React re-read defaultValue,
    // so a failed submit keeps what the user typed instead of resetting the form.
    <form action={formAction} key={state.submittedAt ?? "initial"} className="form" noValidate>
      {state.message && (
        <p className="banner" role="alert">
          {state.message}
        </p>
      )}

      <Field name="customer_name" label="Customer name" errors={errorsFor("customer_name")}>
        <input {...control("customer_name")} type="text" autoComplete="name" defaultValue={value("customer_name", booking?.customer_name)} />
      </Field>

      <Field name="customer_email" label="Customer email" errors={errorsFor("customer_email")}>
        <input {...control("customer_email")} type="email" autoComplete="email" defaultValue={value("customer_email", booking?.customer_email)} />
      </Field>

      <div className="row">
        <Field name="rego" label="Caravan rego" hint="Letters, numbers, spaces and dashes." errors={errorsFor("rego")}>
          <input {...control("rego")} type="text" defaultValue={value("rego", booking?.rego)} />
        </Field>

        <Field name="service_bay" label="Service bay" hint="Bays 1 to 6." errors={errorsFor("service_bay")}>
          <input {...control("service_bay")} type="number" min={1} max={6} defaultValue={value("service_bay", booking?.service_bay?.toString())} />
        </Field>
      </div>

      <div className="row">
        <Field name="starts_at" label="Starts (UTC)" errors={errorsFor("starts_at")}>
          <input {...control("starts_at")} type="datetime-local" defaultValue={value("starts_at", booking ? toInputValue(booking.starts_at) : undefined)} />
        </Field>

        <Field name="ends_at" label="Ends (UTC)" errors={errorsFor("ends_at")}>
          <input {...control("ends_at")} type="datetime-local" defaultValue={value("ends_at", booking ? toInputValue(booking.ends_at) : undefined)} />
        </Field>
      </div>

      {booking && (
        <Field name="status" label="Status" errors={errorsFor("status")}>
          <select {...control("status")} defaultValue={value("status", booking.status)}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field name="notes" label="Notes (optional)" errors={errorsFor("notes")}>
        <textarea {...control("notes")} rows={3} defaultValue={value("notes", booking?.notes ?? undefined)} />
      </Field>

      <div className="actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href={cancelHref} className="button secondary">
          Back
        </Link>
      </div>
    </form>
  );
}
