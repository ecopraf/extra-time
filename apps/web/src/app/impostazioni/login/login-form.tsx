"use client";

import { useActionState } from "react";
import { loginAction, type LoginResult } from "./actions";

const initial: LoginResult = { ok: false, message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="portal-card settings-login-form">
      <label className="settings-field">
        <span>Email</span>
        <input type="email" name="email" autoComplete="username" required autoFocus />
      </label>
      <label className="settings-field">
        <span>Password</span>
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      {state.message ? <p className="settings-error">{state.message}</p> : null}
      <button type="submit" className="settings-btn" disabled={pending}>
        {pending ? "Accesso in corso…" : "Accedi"}
      </button>
    </form>
  );
}
