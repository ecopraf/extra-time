/**
 * Carica su R2 i loghi Gazzetta abbinati ai club (/tmp/gr-loghi/match.json) e
 * genera il mapping clubId→url pubblico in /tmp/gr-loghi/r2.json per il seed.
 *
 * Esclude gli abbinamenti "contenimento" non affidabili (societa' diverse o
 * match su un token troppo generico): meglio nessun logo che uno sbagliato.
 *
 * Env (.r2-credentials): R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT,
 *   R2_BUCKET, R2_PUBLIC_URL
 * Uso: node --env-file=.r2-credentials scripts/loghi/upload-gazzetta.mjs [--test]
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { S3Client, PutObjectCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");

const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET, R2_PUBLIC_URL } = process.env;
const TEST = process.argv.includes("--test");

// Abbinamenti "contenimento" NON affidabili (verificati a mano): societa'
// diverse, citta' diverse, o match su token generico. Esclusi dall'upload.
const ESCLUDI = new Set([
  "ATL.COLOSSEO Cassino",   // != Cassino
  "Alb Rieti A.LAZIO",      // != Rieti (Albalonga)
  "Atina",                  // != Latina (citta' diverse)
  "Nuova Latina Sspp",      // != Latina (incerto)
  "Soratte-capena",         // != Capena (Soratte-Capena e' altra squadra)
  "S.paolo Ostiense",       // != Polisportiva Ostiense
  "N.OSTIENSE",             // Nuova Ostiense vs Polisportiva Ostiense (incerto)
  "Hermes Giuliano di R.",  // match generico "Hermes"
  "Kolbe Ponte Mammolo",    // match generico "Kolbe"
]);

const s3 = new S3Client({
  region: "auto", endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function extOf(url) { const m = url.match(/\.(png|jpg|jpeg|webp|svg)(\?|$)/i); return m ? m[1].toLowerCase() : "png"; }
function contentType(ext) { return { png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", webp:"image/webp", svg:"image/svg+xml" }[ext] || "image/png"; }

async function main() {
  if (!R2_ACCESS_KEY_ID || !R2_ENDPOINT || !R2_BUCKET) { console.error("Credenziali R2 mancanti."); process.exit(1); }
  try { await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKET })); console.error(`✓ R2 ok (${R2_BUCKET})`); }
  catch (e) { console.error("✗ R2:", e.message); process.exit(1); }

  const match = JSON.parse(fs.readFileSync("/tmp/gr-loghi/match.json", "utf8"));
  let items = match.filter((m) => !ESCLUDI.has(m.club));
  if (TEST) items = items.slice(0, 3);
  console.error(`Loghi da caricare: ${items.length} (esclusi ${match.length - items.filter(()=>true).length + (match.length-items.length-0)} ...)`);
  console.error(`  (match totali ${match.length}, esclusi ${match.length - items.length})`);

  const mapping = [];
  let ok = 0, err = 0;
  for (const it of items) {
    try {
      // I file sono già scaricati localmente da fetch-gazzetta; usiamo quelli.
      const buf = fs.readFileSync(it.file);
      const ext = extOf(it.url);
      const key = `clubs/${it.clubId}.${ext}`;
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: contentType(ext),
        CacheControl: "public, max-age=31536000, immutable",
      }));
      mapping.push({ clubId: it.clubId, club: it.club, url: `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}` });
      ok++;
      if (ok % 25 === 0) console.error(`  ...${ok}`);
    } catch (e) { err++; console.error(`  ✗ ${it.club}: ${e.message}`); }
  }
  fs.writeFileSync("/tmp/gr-loghi/r2.json", JSON.stringify(mapping, null, 2));
  console.error(`\nCaricati: ${ok} | errori: ${err} → /tmp/gr-loghi/r2.json`);
}
main().catch((e)=>{console.error(e);process.exit(1);});
