"use client";

/**
 * Azioni in testata (stile template): Assistenza, impostazioni, profilo.
 * Assistenza apre una mail verso l'indirizzo del progetto (mailto): soluzione
 * immediata e senza dipendenze. In futuro (Fase hosting) si sostituirà con un
 * form collegato a Resend — vedi docs/hosting-guida-operativa.md §5.
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
      <button
        type="button"
        className="header-icon"
        title="Impostazioni (in arrivo)"
        aria-label="Impostazioni"
        disabled
      >
        &#9881;
      </button>
      <button
        type="button"
        className="header-icon"
        title="Profilo (in arrivo)"
        aria-label="Profilo"
        disabled
      >
        &#128100;
      </button>
    </div>
  );
}
