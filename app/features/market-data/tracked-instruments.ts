import { periodCovering } from "~/period-covering";
import type { DatePeriod } from "~/period-covering";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { Instrument } from "./price-source.server";

/** The stocks of the LQ45 index of IDX from `from` to `until`, which decision 0014 makes the universe of stocks that students trade in that period. */
interface UniversePeriod extends DatePeriod {
  until: string;
  /** The announcements of IDX that set the stocks, and the reports they were read from. */
  source: string;
  codes: readonly string[];
}

// IDX reviews the LQ45 every three months, so each period is data with the first and the last trading day that IDX announced for it.
const universePeriods: readonly UniversePeriod[] = [
  {
    from: "2026-11-02",
    until: "2027-01-29",
    source:
      "Peng-00204/BEI.POP/10-2026 of 26 October 2026, as Kontan reported it, and Peng-00205/BEI.POP/10-2026 of 27 October 2026, which revised it, as IDX Channel reported it",
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

/** The index that the measures take as the market, which Portolab always tracks. */
export const marketIndex: Instrument = { kind: "index", code: "IHSG" };

/** The instruments whose prices Portolab keeps current: the IHSG, and the stocks of every recorded period of the universe, each once and by code. */
export const trackedInstruments: readonly Instrument[] =
  listTrackedInstruments();

function listTrackedInstruments(): Instrument[] {
  const stockCodes = new Set<string>();
  for (const period of universePeriods) {
    for (const code of period.codes) {
      stockCodes.add(code);
    }
  }
  const instruments: Instrument[] = [marketIndex];
  for (const code of [...stockCodes].sort()) {
    instruments.push({ kind: "stock", code });
  }
  return instruments;
}

/** The codes of the stocks in the universe on a date, such as 2026-11-02. It fails for a date that no recorded period covers, so a missing review of IDX is noticed. */
export function universeOn(date: string): Result<readonly string[], string> {
  const period = periodCovering(universePeriods, date);
  if (period !== undefined) {
    return succeed(period.codes);
  }
  return fail(
    `No recorded period of the LQ45 covers ${date}, so add the stocks of the latest review of IDX to tracked-instruments.ts.`,
  );
}
