import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Inter, Barlow_Condensed } from "next/font/google";
import { hasRole } from "@extra-time/database/auth";
import { HeaderActions } from "@/components/HeaderActions";
import { currentUser } from "@/lib/session";
import { getComunicatiMonitor } from "@/lib/lnd-monitor";
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Solo per l'admin loggato calcoliamo i comunicati "da rivedere": la fetch a
  // LND (cache 5 min) e la lettura della sessione restano a carico del solo
  // admin, i visitatori anonimi non pagano né rete né query.
  const user = await currentUser();
  const isAdmin = hasRole(user, "ADMIN");
  let pendingComunicati = 0;
  if (isAdmin) {
    const monitor = await getComunicatiMonitor();
    if (monitor.ok) pendingComunicati = monitor.nuovi;
  }

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
            <HeaderActions isAdmin={isAdmin} pendingComunicati={pendingComunicati} />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
