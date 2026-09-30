/**
 * pdf-parse non ha typings ufficiali. Il package @extra-time/ingest lo importa
 * dinamicamente (fetch-comunicato). Poiché la web app compila i sorgenti .ts
 * del package, l'ambient declaration deve essere visibile anche qui.
 */
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    info: unknown;
  }
  function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}
