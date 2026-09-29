"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import type { ActionResult } from "./actions";

/**
 * Form del backoffice con feedback sull'esito dell'azione.
 * Usa `useActionState` per mostrare messaggi di successo/errore.
 */
export function ActionForm({
  action,
  submitLabel,
  children,
}: {
  action: (form: FormData) => Promise<ActionResult>;
  submitLabel: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => action(formData),
    null,
  );

  return (
    <form action={formAction} className="admin-form">
      {children}
      <button type="submit" disabled={pending}>
        {pending ? "Salvataggio…" : submitLabel}
      </button>
      {state && (
        <p className={state.ok ? "ok" : "error"} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
