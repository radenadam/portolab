export const conceptTermIds = [
  "beta",
  "simpangan-baku",
  "imbal-hasil-harapan",
  "rasio-sharpe",
  "rasio-treynor",
  "alpha-jensen",
  "bi-rate",
  "ihsg",
  "harga-tertunda",
] as const;

export type ConceptTermId = (typeof conceptTermIds)[number];
