import type { Sector } from "~/features/market-data/company-of";

export const sampleCoreStocks = [
  "BBCA",
  "TLKM",
  "ANTM",
  "ICBP",
  "BMRI",
] as const;
export const sampleConcentratedSectors: readonly Sector[] = [
  "financials",
  "basicMaterials",
  "energy",
];
