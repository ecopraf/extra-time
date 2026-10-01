"use client";

import Link from "next/link";

/**
 * Azioni in testata (stile template): Assistenza e Impostazioni.
 * Assistenza apre una mail verso l'indirizzo del progetto (mailto): soluzione
 * immediata e senza dipendenze. In futuro (Fase hosting) si sostituirà con un
 * form collegato a Resend — vedi docs/hosting-guida-operativa.md §5.
 * Impostazioni porta all'hub protetto (login se non autenticato).
 */

const SUPPORT_EMAIL = "extratime.italia@gmail.com";

/**
 * @param isAdmin            true se l'utente loggato è admin (mostra il badge)
 * @param pendingComunicati  numero di comunicati LND "da rivedere" (0 = nessun badge)
 */
export function HeaderActions({
  isAdmin = false,
  pendingComunicati = 0,
}: {
  isAdmin?: boolean;
  pendingComunicati?: number;
}) {
  const openSupport = () => {
    const subject = encodeURIComponent("Assistenza EXTRA TIME");
    // Nuova finestra/scheda: non abbandona il portale. Fino all'integrazione
    // con Resend (che aprirà una modale in-app) usiamo un mailto in _blank.
    window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}`, "_blank");
  };

  const showBadge = isAdmin && pendingComunicati > 0;
  const settingsTitle = showBadge
    ? `Impostazioni — ${pendingComunicati} ${pendingComunicati === 1 ? "comunicato da rivedere" : "comunicati da rivedere"}`
    : "Impostazioni";

  return (
    <div className="header-actions">
      <button
        type="button"
        className="header-help"
        onClick={openSupport}
        title="Assistenza"
      >
        Assistenza
      </button>
      <Link
        href={showBadge ? "/impostazioni/monitoraggio" : "/impostazioni"}
        className="header-icon"
        title={settingsTitle}
        aria-label={settingsTitle}
      >
        &#9881;
        {showBadge && (
          <span className="header-badge" aria-hidden>
            {pendingComunicati > 9 ? "9+" : pendingComunicati}
          </span>
        )}
      </Link>
    </div>
  );
}
