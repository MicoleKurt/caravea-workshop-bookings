"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "danger" }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={`button ${variant}`} disabled={pending} aria-busy={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}
