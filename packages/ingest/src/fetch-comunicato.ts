/**
 * Download ed estrazione testo di un comunicato LND.
 *
 * I comunicati arrivano in due formati:
 *  - PDF  → testo estratto con pdf-parse
 *  - ZIP  → contiene un .docx; estraiamo word/document.xml (è uno zip di XML)
 *           e ne ricostruiamo il testo per paragrafo.
 *
 * Nessun accesso al filesystem locale: tutto in memoria dall'URL.
 */
import { unzipSync, strFromU8 } from "fflate";

/** Estrae il testo da un PDF in memoria. */
async function pdfToText(buf: Buffer): Promise<string> {
  // NB: importiamo la lib interna (pdf-parse/lib/pdf-parse.js) e NON l'index:
  // l'index di pdf-parse@1.1.1 esegue un blocco "debug" quando !module.parent
  // (vero sotto ESM/bundler) che prova a leggere un PDF di test dal disco e fa
  // fallire l'import. La lib interna è il parser vero, senza quel side-effect.
  type PdfParseFn = (b: Buffer) => Promise<{ text: string }>;
  const mod = (await import("pdf-parse/lib/pdf-parse.js")) as unknown as {
    default?: PdfParseFn;
  } & PdfParseFn;
  const pdfParse: PdfParseFn = mod.default ?? mod;
  const data = await pdfParse(buf);
  return data.text;
}

/**
 * Ricostruisce il testo di un document.xml Word (OOXML).
 * - <w:p> delimita i paragrafi → newline
 * - <w:t> contiene il testo visibile
 * - <w:tab/> → spazio; <w:br/> → newline
 * Semplice e senza dipendenze: niente stili, solo testo in ordine di lettura.
 */
function docXmlToText(xml: string): string {
  // Normalizza break e tab prima di rimuovere i tag.
  let s = xml
    .replace(/<w:tab\b[^>]*\/>/g, " ")
    .replace(/<w:br\b[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n"); // fine paragrafo = a capo
  // Estrai il contenuto dei soli <w:t ...>…</w:t> mantenendo l'ordine.
  const parts: string[] = [];
  const re = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m[0] === "\n") parts.push("\n");
    else parts.push(m[1] ?? "");
  }
  s = parts.join("");
  // Decodifica entità XML di base.
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  // Compatta spazi orizzontali, preserva i newline.
  return s
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
}

/** Estrae il testo dal primo .docx contenuto in uno zip in memoria. */
function zipDocxToText(buf: Buffer): string {
  const files = unzipSync(new Uint8Array(buf));
  // Trova il .docx (o direttamente un document.xml se lo zip è già il docx).
  const docxName = Object.keys(files).find((n) => /\.docx$/i.test(n));
  if (docxName) {
    const inner = unzipSync(files[docxName]!);
    const docXml = inner["word/document.xml"];
    if (!docXml) throw new Error("docx senza word/document.xml");
    return docXmlToText(strFromU8(docXml));
  }
  // Caso in cui lo zip ESTERNO è già l'OOXML (raro).
  const direct = files["word/document.xml"];
  if (direct) return docXmlToText(strFromU8(direct));
  throw new Error("Nessun .docx trovato nell'archivio zip.");
}

/**
 * Scarica un comunicato (PDF o ZIP/DOCX) e ne restituisce il testo.
 * Il formato è dedotto da content-type ed estensione dell'URL.
 */
export async function fetchComunicatoText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (EXTRA TIME import)" },
  });
  if (!res.ok) throw new Error(`Download comunicato fallito: HTTP ${res.status}`);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const buf = Buffer.from(await res.arrayBuffer());

  const isZip = /zip/.test(ct) || /\.zip($|\?)/i.test(url);
  const isPdf = /pdf/.test(ct) || /\.pdf($|\?)/i.test(url);

  if (isZip) return zipDocxToText(buf);
  if (isPdf) return pdfToText(buf);
  // Fallback: prova a riconoscere dai magic bytes.
  if (buf[0] === 0x25 && buf[1] === 0x50) return pdfToText(buf); // %P (PDF)
  if (buf[0] === 0x50 && buf[1] === 0x4b) return zipDocxToText(buf); // PK (zip)
  throw new Error(`Formato comunicato non riconosciuto (content-type: ${ct || "n/d"}).`);
}

/** Retrocompatibilità: scarica un PDF e ne estrae il testo. */
export async function fetchPdfText(url: string): Promise<string> {
  return fetchComunicatoText(url);
}
