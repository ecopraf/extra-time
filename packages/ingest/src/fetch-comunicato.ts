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
  // import dinamico: pdf-parse ha un side-effect su require.main che va evitato
  // caricandolo solo quando serve.
  const mod = await import("pdf-parse");
  const pdfParse = (mod.default ?? mod) as (b: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buf);
  return data.text;
}
