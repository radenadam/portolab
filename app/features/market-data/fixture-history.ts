import { buildDailyHistory } from "./build-daily-history.ts";
import type { DailyHistory, Instrument } from "./price-source.server.ts";

// The closes of each instrument in the last week of October 2026, as Yahoo Finance returned them on 1 November 2026, and ERAA, GGRM, and PWON on 14 November 2026. The closes of BMRI are as Yahoo returned them, including 30 October.
const fixtureDates = [
  "2026-10-26",
  "2026-10-27",
  "2026-10-28",
  "2026-10-29",
  "2026-10-30",
];
const fixtureCloses: Record<string, readonly number[]> = {
  IHSG: [5373.09, 5266.13, 5282.31, 5098.06, 5057.05],
  AADI: [11525, 11700, 11650, 11125, 11475],
  ADMR: [1275, 1255, 1270, 1240, 1250],
  ADRO: [2450, 2460, 2440, 2370, 2400],
  AKRA: [1400, 1435, 1405, 1400, 1375],
  AMMN: [3960, 3760, 3900, 3740, 3650],
  AMRT: [1045, 1040, 1020, 955, 915],
  ANTM: [2760, 2770, 2800, 2670, 2620],
  ASII: [4560, 4630, 5000, 4690, 4800],
  BBCA: [4940, 4900, 5275, 4940, 4980],
  BBNI: [3470, 3310, 3350, 3240, 3320],
  BBRI: [2910, 2900, 2920, 2810, 2800],
  BBTN: [935, 925, 935, 910, 900],
  BMRI: [3910, 3870, 3840, 3720, 3720],
  BRPT: [1420, 1325, 1235, 1150, 1070],
  BUMI: [137, 128, 127, 121, 119],
  CPIN: [2710, 2780, 2670, 2590, 2550],
  DEWA: [260, 242, 240, 226, 214],
  ELSA: [640, 685, 655, 620, 625],
  EMTK: [336, 318, 324, 304, 296],
  ERAA: [560, 570, 550, 515, 482],
  ESSA: [515, 535, 525, 505, 500],
  EXCL: [1795, 1730, 1690, 1625, 1720],
  GGRM: [16450, 17150, 16200, 16025, 16400],
  GOTO: [25, 24, 24, 23, 24],
  HRTA: [1660, 1605, 1595, 1510, 1430],
  ICBP: [5975, 5750, 5775, 5575, 5475],
  INCO: [3720, 3500, 3620, 3400, 3420],
  INDF: [6675, 6650, 6375, 6275, 6400],
  INDY: [2110, 2020, 1995, 1860, 1780],
  INKP: [6950, 6800, 6750, 6525, 6575],
  ISAT: [1700, 1685, 1570, 1465, 1365],
  ITMG: [25200, 24650, 24975, 24600, 24900],
  JPFA: [1785, 1785, 1810, 1735, 1740],
  KLBF: [725, 710, 735, 715, 730],
  MAPI: [1325, 1320, 1320, 1260, 1235],
  MBMA: [354, 330, 326, 306, 298],
  MDKA: [2060, 2000, 2050, 1920, 1855],
  MEDC: [1450, 1410, 1405, 1340, 1390],
  NCKL: [775, 735, 750, 725, 725],
  PGAS: [1315, 1240, 1280, 1215, 1320],
  PGEO: [1010, 980, 990, 960, 905],
  PTBA: [3220, 3170, 3250, 3060, 3240],
  PWON: [284, 294, 290, 286, 282],
  SMGR: [1465, 1485, 1440, 1365, 1335],
  TLKM: [2250, 2140, 2070, 1980, 1980],
  UNTR: [25000, 26500, 25600, 24550, 24200],
  UNVR: [1425, 1395, 1405, 1400, 1390],
  WIFI: [1040, 970, 1005, 935, 910],
};

/** The closes of an instrument from a date in WIB that the fixture source records, or undefined when it records none of the instrument. The browser tests store some of them before the server starts, because the history job of the server asks for the closes of the latest trading day, which the fixture lacks, so it stores none. */
export function fixtureHistory(
  instrument: Instrument,
  from: string,
): DailyHistory | undefined {
  const closes = fixtureCloses[instrument.code];
  return closes === undefined
    ? undefined
    : buildDailyHistory(instrument, datedCloses(closes, from));
}

function datedCloses(
  closes: readonly number[],
  from: string,
): [string, number][] {
  const dated: [string, number][] = [];
  for (const [index, date] of fixtureDates.entries()) {
    const close = closes[index];
    if (close === undefined) {
      throw new Error(`The fixture has no close on ${date}.`);
    }
    if (date >= from) {
      dated.push([date, close]);
    }
  }
  return dated;
}
