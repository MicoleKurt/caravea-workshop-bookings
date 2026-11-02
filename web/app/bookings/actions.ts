"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";
import { fromInputValue } from "@/lib/format";

export type FormState = {
  /** Laravel's validation errors, keyed by field name. */
  errors?: Record<string, string[]>;
  message?: string;
  /** What the user typed, so a failed submit does not wipe the form. */
  values?: Record<string, string>;
  submittedAt?: number;
};

const FIELDS = [
  "customer_name",
  "customer_email",
  "rego",
  "service_bay",
  "starts_at",
  "ends_at",
  "status",
  "notes",
] as const;

function readForm(formData: FormData) {
  const values: Record<string, string> = {};
  for (const field of FIELDS) {
    const raw = formData.get(field);
    if (typeof raw === "string") values[field] = raw;
  }
  return values;
}

function toPayload(values: Record<string, string>) {
  const payload: Record<string, unknown> = { ...values };
  if ("starts_at" in values) payload.starts_at = fromInputValue(values.starts_at);
  if ("ends_at" in values) payload.ends_at = fromInputValue(values.ends_at);
  if ("service_bay" in values) payload.service_bay = values.service_bay === "" ? null : Number(values.service_bay);
  if ("notes" in values) payload.notes = values.notes.trim() === "" ? null : values.notes;
  return payload;
}

async function send(method: "POST" | "PATCH", path: string, body: Record<string, unknown>) {
  return fetch(`${API_URL}${path}`, {
    method,
    cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Turn the API reply into form state; returns null when the call succeeded. */
async function failure(res: Response, values: Record<string, string>): Promise<FormState | null> {
  if (res.ok) return null;

  if (res.status === 422) {
    const { errors } = await res.json();
    return { errors, values, submittedAt: Date.now() };
  }
  return {
    message: "The booking service is not responding. Nothing was saved, so please try again.",
    values,
    submittedAt: Date.now(),
  };
}

export async function createBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);

  let res: Response;
  try {
    res = await send("POST", "/bookings", toPayload(values));
  } catch {
    return failure(new Response(null, { status: 503 }), values) as Promise<FormState>;
  }

  const problem = await failure(res, values);
  if (problem) return problem;

  const { data } = await res.json();
  updateTag("bookings");
  redirect(`/bookings/${data.id}`);
}

export async function updateBooking(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);

  let res: Response;
  try {
    res = await send("PATCH", `/bookings/${id}`, toPayload(values));
  } catch {
    return failure(new Response(null, { status: 503 }), values) as Promise<FormState>;
  }

  const problem = await failure(res, values);
  if (problem) return problem;

  updateTag("bookings");
  updateTag(`booking-${id}`);
  redirect(`/bookings/${id}`);
}

export async function cancelBooking(id: number): Promise<void> {
  const res = await send("PATCH", `/bookings/${id}`, { status: "cancelled" });
  if (!res.ok) throw new Error("Could not cancel the booking.");

  updateTag("bookings");
  updateTag(`booking-${id}`);
}
