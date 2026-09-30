/**
 * Download ed estrazione testo di un comunicato PDF LND.
 * Usa pdf-parse (dipendenza del package). Nessun accesso al filesystem locale
 * di YFM: scarica il PDF dall'URL e lo passa in memoria.
 */

/** Scarica il PDF e ne estrae il testo. */
export async function fetchPdfText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (EXTRA TIME import)" },
  });
  if (!res.ok) throw new Error(`Download PDF fallito: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // NB: importiamo la lib interna (pdf-parse/lib/pdf-parse.js) e NON l'index:
  // l'index di pdf-parse@1.1.1 esegue un blocco "debug" quando !module.parent
  // (vero sotto ESM/bundler) che prova a leggere un PDF di test dal disco
  // ("./test/data/05-versions-space.pdf") e fa fallire l'import. La lib interna
  // è il parser vero e proprio, senza quel side-effect.
  type PdfParseFn = (b: Buffer) => Promise<{ text: string }>;
  const mod = (await import("pdf-parse/lib/pdf-parse.js")) as unknown as {
    default?: PdfParseFn;
  } & PdfParseFn;
  const pdfParse: PdfParseFn = mod.default ?? mod;
  const data = await pdfParse(buf);
  return data.text;
}
