import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// Three voices: an editorial serif for headings, a grotesk for the interface,
// and a mono for the things that are codes (number plates, times).
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const sans = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "Workshop bookings", template: "%s | Workshop bookings" },
  description: "Book a caravan into a service bay.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/bookings" className="brand">
            <span className="brand-name">Workshop</span>
            <span className="brand-sub">bookings</span>
          </Link>
          <Link href="/bookings/new" className="header-cta">
            New booking <span aria-hidden="true">→</span>
          </Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
