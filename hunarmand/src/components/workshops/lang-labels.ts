/* -------------------------------------------------------------------------
 * Lightweight language-code → label map shared by the booking widget,
 * the booking flow forms, and the confirmation certificate.
 *
 * The artisans module exports a richer LANG_LABEL with native scripts;
 * we re-state a thinner LTR-friendly version here so the booking flow
 * doesn't pull the entire artisans tree just for a label lookup.
 * ----------------------------------------------------------------------- */

export const LANG_LABEL_FALLBACK: Record<string, string> = {
  ks: "Koshur (Kashmiri)",
  ur: "Urdu",
  hi: "Hindi",
  en: "English",
  ja: "Japanese",
  fr: "French",
};

export function languageLabelFallback(code: string): string {
  return LANG_LABEL_FALLBACK[code] ?? code.toUpperCase();
}
