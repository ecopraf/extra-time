/**
 * Upload loghi su Cloudflare R2 e generazione mapping clubId -> URL pubblico.
 *
 * Legge /tmp/loghi_match.json (match sicuri + dubbi confermati), scarica ogni
 * logo dal bucket pubblico Supabase di YFM (logo_path = URL completo) e lo
 * ricarica su R2 con chiave stabile (clubId.ext). Produce /tmp/loghi_r2.json
 * con { clubId, url } per il collegamento al Core.
 *
 * Env (.r2-credentials): R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT,
 *   R2_BUCKET, R2_PUBLIC_URL
 * Uso: node --env-file=.r2-credentials scripts/loghi/upload-loghi.mjs [--test]
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { S3Client, PutObjectCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");

const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET,
  R2_PUBLIC_URL,
} = process.env;

const TEST = process.argv.includes("--test");

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function extOf(url) {
  const m = url.match(/\.(png|jpg|jpeg|webp|svg)(\?|$)/i);
  return m ? m[1].toLowerCase() : "png";
}
function contentType(ext) {
  return { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" }[ext] || "image/png";
}

async function main() {
  if (!R2_ACCESS_KEY_ID || !R2_ENDPOINT || !R2_BUCKET) {
    console.error("Credenziali R2 mancanti (.r2-credentials).");
    process.exit(1);
  }

  // Test connessione bucket
  try {
    await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
    console.log(`✓ Connessione R2 ok, bucket "${R2_BUCKET}" raggiungibile`);
  } catch (e) {
    console.error("✗ R2 non raggiungibile:", e.message);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync("/tmp/loghi_match.json", "utf8"));
  // sicuri + dubbi (i dubbi sono quasi tutti corretti; l'unico da escludere lo
  // togliamo qui per nome esatto).
  const ESCLUDI = new Set(["S.paolo Ostiense"]); // match dubbio non affidabile
  let items = [...report.dettaglio.sicuri, ...report.dettaglio.dubbi].filter(
    (x) => x.logo_path && !ESCLUDI.has(x.club),
  );
  if (TEST) items = items.slice(0, 3);

  console.log(`Loghi da caricare: ${items.length}${TEST ? " (TEST: solo 3)" : ""}`);
  const mapping = [];
  let ok = 0, err = 0;

  for (const it of items) {
    try {
      const res = await fetch(it.logo_path);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = extOf(it.logo_path);
      const key = `clubs/${it.clubId}.${ext}`;
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buf,
        ContentType: contentType(ext),
        CacheControl: "public, max-age=31536000, immutable",
      }));
      const url = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
      mapping.push({ clubId: it.clubId, club: it.club, url });
      ok++;
      if (ok % 25 === 0) console.log(`  ...${ok} caricati`);
    } catch (e) {
      err++;
      console.error(`  ✗ ${it.club}: ${e.message}`);
    }
  }

  fs.writeFileSync("/tmp/loghi_r2.json", JSON.stringify(mapping, null, 2));
  console.log(`\nCaricati: ${ok} | errori: ${err}`);
  console.log(`Mapping clubId->url scritto in /tmp/loghi_r2.json`);
  if (mapping[0]) console.log(`Esempio URL: ${mapping[0].url}`);
}

main().catch((e) => { console.error("Errore:", e.message); process.exit(1); });
