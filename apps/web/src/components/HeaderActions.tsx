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

export function HeaderActions() {
  const openSupport = () => {
    const subject = encodeURIComponent("Assistenza EXTRA TIME");
    // Nuova finestra/scheda: non abbandona il portale. Fino all'integrazione
    // con Resend (che aprirà una modale in-app) usiamo un mailto in _blank.
    window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}`, "_blank");
  };

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
        href="/impostazioni"
        className="header-icon"
        title="Impostazioni"
        aria-label="Impostazioni"
      >
        &#9881;
      </Link>
    </div>
  );
}
