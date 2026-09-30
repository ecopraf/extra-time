import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Inter, Barlow_Condensed } from "next/font/google";
import { HeaderActions } from "@/components/HeaderActions";
import "./globals.css";

// Font self-hosted da next/font: nessuna richiesta a Google a runtime, nessun
// layout shift. Inter per l'interfaccia, Barlow Condensed per numeri e titoli.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EXTRA TIME",
  description:
    "Piattaforma digitale per dare visibilità al calcio dilettantistico e giovanile italiano.",
};

export const viewport = {
  themeColor: "#011c4e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand" aria-label="EXTRA TIME — home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-extra-time.svg" alt="EXTRA TIME" className="brand-logo" />
            </Link>
            <nav className="portal-nav" aria-label="Navigazione principale">
              <Link href="/campionati">Campionati</Link>
              <Link href="/news">News</Link>
              <Link href="/scout">Scout</Link>
              <Link href="/live" className="is-live">
                <span className="live-dot" aria-hidden />
                Live
              </Link>
            </nav>
            <HeaderActions />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
