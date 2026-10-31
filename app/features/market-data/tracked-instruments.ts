import type { Instrument } from "./price-source.server";

/** The instruments whose prices Portolab keeps current. */
export const trackedInstruments: readonly Instrument[] = [
  { kind: "index", code: "IHSG" },
  { kind: "stock", code: "BBCA" },
  { kind: "stock", code: "BBRI" },
  { kind: "stock", code: "BMRI" },
  { kind: "stock", code: "TLKM" },
  { kind: "stock", code: "ASII" },
];
