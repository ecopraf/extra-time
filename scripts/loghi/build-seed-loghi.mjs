/**
 * Genera il seed SQL che collega i loghi caricati su R2 ai club del Core.
 *
 * Input: /tmp/loghi_r2.json = [{ clubId, club, url }] prodotto da upload-loghi.mjs.
 * Per ogni voce:
 *   - inserisce una riga media (kind='image', provider='r2', caption='logo')
 *     con id deterministico = uuid("media-logo", clubId), così è idempotente;
 *   - imposta clubs.logo_media_id = quell'id.
 *
 * media.id deterministico → ri-eseguibile senza duplicare media. L'UPDATE su
 * clubs è idempotente per natura.
 *
 * Uso: node scripts/loghi/build-seed-loghi.mjs <in.json> <out.sql>
 */
import fs from "node:fs";
import crypto from "node:crypto";

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error("Uso: node build-seed-loghi.mjs <in.json> <out.sql>");
  process.exit(1);
}

function uuid(ns, key) {
  const h = crypto.createHash("md5").update(`${ns}:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const esc = (s) => String(s).replace(/'/g, "''");

const mapping = JSON.parse(fs.readFileSync(inPath, "utf8"));

const lines = [];
lines.push("-- EXTRA TIME — Collegamento loghi società (R2) — aggiornamento dilettanti + giovanili");
lines.push("-- Generato da scripts/loghi/build-seed-loghi.mjs — NON modificare a mano.");
lines.push("-- media.kind='image', caption='logo'. media.id deterministico → idempotente.");
lines.push("");
lines.push("begin;");
lines.push("");

// media
lines.push("insert into media (id, kind, provider, url, caption) values");
const mediaVals = [];
const mediaIdByClub = new Map();
for (const m of mapping) {
  const mediaId = uuid("media-logo", m.clubId);
  mediaIdByClub.set(m.clubId, mediaId);
  mediaVals.push(`  ('${mediaId}', 'image', 'r2', '${esc(m.url)}', 'logo')`);
}
lines.push(mediaVals.join(",\n"));
lines.push("on conflict (id) do update set url = excluded.url;");
lines.push("");

// clubs.logo_media_id
for (const m of mapping) {
  const mediaId = mediaIdByClub.get(m.clubId);
  lines.push(`update clubs set logo_media_id = '${mediaId}' where id = '${m.clubId}';`);
}
lines.push("");
lines.push("commit;");
lines.push("");

fs.writeFileSync(outPath, lines.join("\n"));
console.error(`Seed loghi scritto: ${outPath} (${mapping.length} loghi)`);
