/**
 * @extra-time/ingest — logica condivisa di import calendari LND.
 * Usata sia dagli script CLI (scripts/import-sgs/*) sia dal web (endpoint admin).
 */
export { parseProgrammaGare, classifyCategoria, normalizeTeamName, canonicalizeClub, toIso } from "./parse-programma-gare";
export type { Gara } from "./parse-programma-gare";
export { applyProgrammaGare, sameTeam } from "./apply-programma-gare";
export type { ApplyResult, Queryable } from "./apply-programma-gare";
export { parseRisultati } from "./parse-risultati";
export type { Risultato } from "./parse-risultati";
export { applyRisultati } from "./apply-risultati";
export type { ApplyRisultatiResult } from "./apply-risultati";
export { fetchComunicatoText, fetchPdfText } from "./fetch-comunicato";
