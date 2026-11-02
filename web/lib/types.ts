// Shared by server and client code, so nothing here may touch the server.

export const STATUSES = ["pending", "confirmed", "cancelled"] as const;
export type BookingStatus = (typeof STATUSES)[number];

export type Booking = {
  id: number;
  customer_name: string;
  customer_email: string;
  rego: string;
  service_bay: number;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingPage = {
  data: Booking[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};
