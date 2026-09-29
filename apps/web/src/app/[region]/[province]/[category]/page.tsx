import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProvinceByCode,
  getRegionByCode,
  listGroupsByProvinceCategory,
} from "@extra-time/database";

export const revalidate = 300;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ region: string; province: string; category: string }>;
}) {
  const {
    region: regionCode,
    province: provinceCode,
    category,
  } = await params;
  const region = await getRegionByCode(regionCode.toUpperCase());
  if (!region) notFound();
  const province = await getProvinceByCode(provinceCode.toUpperCase());
  if (!province) notFound();

  const groups = await listGroupsByProvinceCategory(province.id, category);

  return (
    <main>
      <nav className="breadcrumb">
        <Link href="/">Italia</Link> /{" "}
        <Link href={`/${region.code.toLowerCase()}`}>{region.name}</Link> /{" "}
        <Link href={`/${region.code.toLowerCase()}/${province.code.toLowerCase()}`}>
          {province.name}
        </Link>{" "}
        / {category}
      </nav>
      <h1>{groups[0]?.competitionName ?? category.toUpperCase()}</h1>
      <p className="lead">Scegli un girone.</p>

      {groups.length === 0 ? (
        <p className="empty">Nessun girone per questa categoria.</p>
      ) : (
        <ul className="card-list">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/${region.code.toLowerCase()}/${province.code.toLowerCase()}/${category}/${(group.code ?? "a").toLowerCase()}`}
              >
                {group.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
