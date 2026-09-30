import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Se già autenticato, vai all'hub.
  if (await currentUser()) redirect("/impostazioni");
  return (
    <main className="portal">
      <section className="portal-hero">
        <h1>Impostazioni</h1>
        <p className="lead">Accedi per gestire dati e contenuti del portale.</p>
      </section>
      <div className="settings-login">
        <LoginForm />
      </div>
    </main>
  );
}
