import { NextResponse, type NextRequest } from "next/server";

/**
 * Protezione delle route riservate.
 *
 * Il middleware gira su Edge: NON può accedere al DB. Fa solo un controllo
 * leggero sulla PRESENZA del cookie di sessione e reindirizza al login se
 * assente. La validazione vera della sessione (non scaduta/revocata su Neon)
 * avviene nelle pagine/Server Actions via currentUser().
 *
 * - /impostazioni/*  → richiede il cookie (tranne /impostazioni/login)
 * - /admin/*         → deprecato: redirect all'hub /impostazioni
 */
const SESSION_COOKIE = "et_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Il vecchio backoffice /admin (token in URL) è sostituito dall'hub.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/impostazioni", req.url));
  }

  // Login è pubblico.
  if (pathname === "/impostazioni/login") return NextResponse.next();

  if (pathname === "/impostazioni" || pathname.startsWith("/impostazioni/")) {
    const hasCookie = req.cookies.has(SESSION_COOKIE);
    if (!hasCookie) {
      return NextResponse.redirect(new URL("/impostazioni/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/impostazioni/:path*", "/admin/:path*"],
};
