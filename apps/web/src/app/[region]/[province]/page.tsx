import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProvinceByCode,
  getRegionByCode,
  listCompetitionsForProvince,
} from "@extra-time/database";
import { slugify } from "@/lib/format";

export const revalidate = 300;

export default async function ProvincePage({
  params,
}: {
  params: Promise<{ region: string; province: string }>;
}) {
  const { region: regionCode, province: provinceCode } = await params;
  const region = await getRegionByCode(regionCode.toUpperCase());
  if (!region) notFound();
  const province = await getProvinceByCode(provinceCode.toUpperCase());
  if (!province) notFound();

  const competitions = await listCompetitionsForProvince(province.id);

  return (
    <main className="portal">
      <section className="portal-hero">
        <nav className="breadcrumb">
          <Link href="/">Italia</Link> /{" "}
          <Link href={`/${region.code.toLowerCase()}`}>{region.name}</Link> /{" "}
          {province.name}
        </nav>
        <h1>{province.name}</h1>
        <p className="lead">Scegli una categoria.</p>
      </section>

      <section className="portal-section">
        {competitions.length === 0 ? (
          <p className="empty">Nessuna competizione nella stagione corrente.</p>
        ) : (
          <ul className="portal-links">
            {competitions.map((competition) => (
              <li key={competition.id}>
                <Link
                  href={`/${region.code.toLowerCase()}/${province.code.toLowerCase()}/${slugify(competition.category)}`}
                >
                  {competition.name}
                  {competition.level && (
                    <span className="count">{competition.level}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
