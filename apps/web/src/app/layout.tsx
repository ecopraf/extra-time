import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Mark, Wordmark } from "@extra-time/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "EXTRA TIME",
  description:
    "Piattaforma digitale per dare visibilità al calcio dilettantistico e giovanile italiano.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand" aria-label="EXTRA TIME — home">
              <Mark size={30} />
              <Wordmark size={20} />
            </Link>
            <span className="brand-tag">
              calcio dilettantistico e giovanile
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
