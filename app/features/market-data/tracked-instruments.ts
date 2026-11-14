import { periodOf } from "../../period-of.ts";
import type { DatePeriod } from "../../period-of.ts";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import type { Instrument } from "./price-source.server.ts";

/** The stocks of the LQ45 index of IDX from `from` to `until`, which decision 0014 makes the universe of stocks that students trade in that period. */
interface UniversePeriod extends DatePeriod {
  until: string;
  /** The announcements of IDX that set the stocks, and the reports they were read from. */
  source: string;
  codes: readonly string[];
}

// IDX can revise a quarterly list through an incidental review, so a period ends before the next review takes effect.
const universePeriods = [
  {
    from: "2026-11-02",
    until: "2026-11-17",
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
  {
    from: "2026-11-18",
    until: "2027-01-29",
    source:
      "Peng-00218/BEI.POP/11-2026 of 11 November 2026, announcement and Appendix 1 read at https://www.idx.id/StaticData/NewsAndAnnouncement/ANNOUNCEMENTSTOCK/Exchange/No.%20Peng-00218_BEI.POP_11-2026-ID.zip on 14 November 2026. Reports: https://investasi.kontan.co.id/news/masuk-hsc-3-saham-dikeluarkan-dari-indeks-lq45-berlaku-18-nov-2026-cek-daftarnya (read through https://id.tradingview.com/news/kontan%3Aa3fcb30d987ea%3A0/) and https://www.liputan6.com/saham/read/8333491/bei-ubah-penghuni-saham-lq45-intip-daftar-terbaru. The 45 codes agree with Appendix 1, Liputan6, and the previous period after the three announced replacements. Kontan's list writes ERRA for ERAA, dates its heading 2025, and has CUAN instead of ELSA. Appendix 1 confirms ERAA, 2026, and ELSA.",
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
      "ERAA",
      "ESSA",
      "EXCL",
      "GGRM",
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
      "MBMA",
      "MDKA",
      "MEDC",
      "PGAS",
      "PTBA",
      "PWON",
      "SMGR",
      "TLKM",
      "UNTR",
      "UNVR",
      "WIFI",
    ],
  },
] as const satisfies readonly UniversePeriod[];

/** The code of a stock of a recorded period of the universe, so a table typed over it, such as the companies of the stocks, lacks no code of a period that a review of IDX adds. */
export type TrackedStockCode =
  (typeof universePeriods)[number]["codes"][number];

/** The index that the measures take as the market, which Portolab always tracks. */
export const marketIndex: Extract<Instrument, { kind: "index" }> = {
  kind: "index",
  code: "IHSG",
};

/** The codes of the stocks of every recorded period of the universe, each once and in order, whose prices Portolab keeps current. A student can sell a holding of any of them, also after it left the universe. */
export const trackedStockCodes: readonly string[] = listTrackedStockCodes();

/** The instruments whose prices Portolab keeps current: the IHSG, and the stocks of every recorded period of the universe, each once and by code. */
export const trackedInstruments: readonly Instrument[] = [
  marketIndex,
  ...trackedStockCodes.map((code): Instrument => ({ kind: "stock", code })),
];

function listTrackedStockCodes(): string[] {
  const stockCodes = new Set<string>();
  for (const period of universePeriods) {
    for (const code of period.codes) {
      stockCodes.add(code);
    }
  }
  return [...stockCodes].sort();
}

/** The codes of the stocks in the universe on a date, such as 2026-11-02. It fails for a date that no recorded period covers, so a missing review of IDX is noticed. */
export function universeOn(date: string): Result<readonly string[], string> {
  const file = "tracked-instruments.ts";
  const period = periodOf(
    { name: "the LQ45", file, periods: universePeriods },
    date,
  );
  if (!period.ok) {
    return fail(
      `No recorded period of the LQ45 covers ${date}, so add the stocks of the LQ45 that IDX set for that day to ${file}.`,
    );
  }
  return succeed(period.value.codes);
}
