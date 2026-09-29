import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Inter, Barlow_Condensed } from "next/font/google";
import { Mark, Wordmark } from "@extra-time/ui";
import "./globals.css";

// Font self-hosted da next/font: nessuna richiesta a Google a runtime, nessun
// layout shift. Inter per l'interfaccia, Barlow Condensed per numeri e titoli
// (punteggi, classifiche): vedi packages/ui/src/tokens.ts.
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand" aria-label="EXTRA TIME — home">
              <Mark size={30} />
              <Wordmark size={20} />
            </Link>
            <nav className="portal-nav" aria-label="Navigazione principale">
              <Link href="/calcio">Calcio</Link>
              <Link href="/risultati">Risultati</Link>
              <Link href="/classifiche">Classifiche</Link>
              <Link href="/live" className="is-live">
                <span className="live-dot" aria-hidden />
                Live
              </Link>
            </nav>
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
