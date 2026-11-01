import { expect, test } from "vitest";
import { missingDataWarnings } from "./missing-data-warnings";

// The states follow the price hours of a source with this delay.
const delayMinutes = 10;

const missingUniverse =
  "No recorded period of the LQ45 covers 2027-02-01, so add the stocks of the latest review of IDX to tracked-instruments.ts.";

// Each state of the schedule, with the warnings about missing data that it gives. The recorded period of the LQ45 ends on Friday 29 January 2027, so Monday 1 February 2027 is a trading day that no period covers. The comment of each state gives the moment in WIB.
const warningStates: { name: string; moment: string; warnings: string[] }[] = [
  {
    // 10:00 WIB on Monday 2 November 2026.
    name: "during a session that a period of the LQ45 covers",
    moment: "2026-11-02T03:00:00.000Z",
    warnings: [],
  },
  {
    // 10:00 WIB on Monday 1 February 2027.
    name: "during a session that no period of the LQ45 covers",
    moment: "2027-02-01T03:00:00.000Z",
    warnings: [missingUniverse],
  },
  {
    // 16:25 WIB on Monday 1 February 2027.
    name: "in the last minute of the price hours of such a day",
    moment: "2027-02-01T09:25:00.000Z",
    warnings: [missingUniverse],
  },
  {
    // 16:26 WIB on Monday 1 February 2027.
    name: "after the close of such a day",
    moment: "2027-02-01T09:26:00.000Z",
    warnings: [],
  },
  {
    // 10:00 WIB on Saturday 30 January 2027.
    name: "on a weekend",
    moment: "2027-01-30T03:00:00.000Z",
    warnings: [],
  },
  {
    // 10:00 WIB on Tuesday 16 February 2027, a holiday.
    name: "on a holiday",
    moment: "2027-02-16T03:00:00.000Z",
    warnings: [],
  },
  {
    // 10:00 WIB on Monday 3 January 2028.
    name: "on a date that no calendar covers",
    moment: "2028-01-03T03:00:00.000Z",
    warnings: [
      "No IDX trading calendar covers 2028-01-03, so add the holidays and trading hours of that year to idx-calendar.ts.",
    ],
  },
];

for (const state of warningStates) {
  test(`${state.warnings.length > 0 ? "warns about the missing data" : "gives no warning"} ${state.name}`, () => {
    expect(missingDataWarnings(new Date(state.moment), delayMinutes)).toEqual(
      state.warnings,
    );
  });
}
