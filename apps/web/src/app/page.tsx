import Link from "next/link";
import { listRegions } from "@extra-time/database";

export const revalidate = 300;

export default async function Home() {
  const regions = await listRegions();

  return (
    <main>
      <h1>EXTRA TIME</h1>
      <p className="lead">
        Calendari, risultati e classifiche del calcio dilettantistico e giovanile.
        Scegli una regione per iniziare.
      </p>

      {regions.length === 0 ? (
        <p className="empty">
          Nessuna regione disponibile. Popola il core con <code>pnpm db:setup</code>.
        </p>
      ) : (
        <ul className="card-list">
          {regions.map((region) => (
            <li key={region.id}>
              <Link href={`/${region.code.toLowerCase()}`}>{region.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
