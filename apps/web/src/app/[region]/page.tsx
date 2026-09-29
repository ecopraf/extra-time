import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegionByCode, listProvincesByRegion } from "@extra-time/database";

export const revalidate = 300;

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: regionCode } = await params;
  const region = await getRegionByCode(regionCode.toUpperCase());
  if (!region) notFound();

  const provinces = await listProvincesByRegion(region.id);

  return (
    <main>
      <nav className="breadcrumb">
        <Link href="/">Italia</Link> / {region.name}
      </nav>
      <h1>{region.name}</h1>
      <p className="lead">Scegli una provincia.</p>

      <ul className="card-list">
        {provinces.map((province) => (
          <li key={province.id}>
            <Link href={`/${region.code.toLowerCase()}/${province.code.toLowerCase()}`}>
              {province.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
