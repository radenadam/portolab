import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { Instrument } from "./price-source.server";

/** The stocks of the LQ45 index of IDX from `from` to `until`, which decision 0014 makes the universe of stocks that students trade in that period. */
interface UniversePeriod {
  from: string;
  until: string;
  /** The announcements of IDX that set the stocks. */
  source: string;
  codes: readonly string[];
}

// IDX reviews the LQ45 every three months, so each period is data with the first and the last trading day that IDX announced for it.
const universePeriods: readonly UniversePeriod[] = [
  {
    from: "2026-11-02",
    until: "2027-01-29",
    source:
      "Peng-00204/BEI.POP/10-2026 of 26 October 2026, as Peng-00205/BEI.POP/10-2026 of 27 October 2026 revised it",
    codes: [
      "AADI",
      "ADMR",
      "ADRO",
      "AKRA",
      "AMMN",
      "AMRT",
      "ANTM",
      "ASII",
      "BBCA",
      "BBNI",
      "BBRI",
      "BBTN",
      "BMRI",
      "BRPT",
      "BUMI",
      "CPIN",
      "DEWA",
      "ELSA",
      "EMTK",
      "ESSA",
      "EXCL",
      "GOTO",
      "HRTA",
      "ICBP",
      "INCO",
      "INDF",
      "INDY",
      "INKP",
      "ISAT",
      "ITMG",
      "JPFA",
      "KLBF",
      "MAPI",
      "MBMA",
      "MDKA",
      "MEDC",
      "NCKL",
      "PGAS",
      "PGEO",
      "PTBA",
      "SMGR",
      "TLKM",
      "UNTR",
      "UNVR",
      "WIFI",
    ],
  },
];

/** The instruments whose prices Portolab keeps current: the IHSG, and the stocks of every recorded period of the universe, each once and by code. */
export const trackedInstruments: readonly Instrument[] = [
  { kind: "index", code: "IHSG" },
  ...[...new Set(universePeriods.flatMap((period) => period.codes))]
    .sort()
    .map((code): Instrument => ({ kind: "stock", code })),
];

/** The codes of the stocks in the universe on a date, such as 2026-11-02. It fails for a date that no recorded period covers, so a missing review of IDX is noticed. */
export function universeOn(date: string): Result<readonly string[], string> {
  for (const period of universePeriods) {
    if (date >= period.from && date <= period.until) {
      return succeed(period.codes);
    }
  }
  return fail(
    `No recorded period of the LQ45 covers ${date}, so add the stocks of the latest review of IDX to tracked-instruments.ts.`,
  );
}
