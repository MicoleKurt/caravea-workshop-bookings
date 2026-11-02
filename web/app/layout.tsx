import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Workshop bookings", template: "%s | Workshop bookings" },
  description: "Book a caravan into a service bay.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/bookings" className="brand">
            Workshop bookings
          </Link>
          <Link href="/bookings/new" className="button primary small">
            New booking
          </Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
