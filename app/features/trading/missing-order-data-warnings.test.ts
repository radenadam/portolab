import { expect, test } from "vitest";
import { missingOrderDataWarnings } from "./missing-order-data-warnings";

// The states follow the price hours of a source with this delay.
const delayMinutes = 10;

const rulesOfJanuary4 =
  "No recorded IDX rule for the auto rejection limits covers 2027-01-04, so add the rules that IDX set for that day to idx-rules-on.ts.";

// Each state of the schedule, with the warning that it gives. The recorded auto rejection limits end on Thursday 31 December 2026, so Monday 4 January 2027 is the first trading day without them, which the coming weeks reach from Monday 7 December 2026. The comment of each state gives the moment in WIB.
const warningStates: { name: string; moment: string; warnings: string[] }[] = [
  {
    // 10:00 WIB on Monday 2 November 2026.
    name: "during a session whose coming weeks have every record",
    moment: "2026-11-02T03:00:00.000Z",
    warnings: [],
  },
  {
    // 23:59 WIB on Sunday 6 December 2026.
    name: "in the last minute before the coming weeks reach a trading day without a record",
    moment: "2026-12-06T16:59:00.000Z",
    warnings: [],
  },
  {
    // 00:00 WIB on Monday 7 December 2026.
    name: "from the first minute in which the coming weeks reach that day",
    moment: "2026-12-06T17:00:00.000Z",
    warnings: [rulesOfJanuary4],
  },
  {
    // 10:00 WIB on Friday 11 December 2026.
    name: "during a session of a Friday",
    moment: "2026-12-11T03:00:00.000Z",
    warnings: [rulesOfJanuary4],
  },
  {
    // 16:26 WIB on Friday 11 December 2026.
    name: "after the close of a Friday",
    moment: "2026-12-11T09:26:00.000Z",
    warnings: [rulesOfJanuary4],
  },
  {
    // 10:00 WIB on Wednesday 30 December 2026.
    name: "during a session of the last trading day before that day",
    moment: "2026-12-30T03:00:00.000Z",
    warnings: [rulesOfJanuary4],
  },
  {
    // 16:25 WIB on Wednesday 30 December 2026.
    name: "in the last minute of the price hours of that trading day",
    moment: "2026-12-30T09:25:00.000Z",
    warnings: [rulesOfJanuary4],
  },
  {
    // 16:26 WIB on Wednesday 30 December 2026.
    name: "after the close of that trading day",
    moment: "2026-12-30T09:26:00.000Z",
    warnings: [rulesOfJanuary4],
  },
  {
    // 10:00 WIB on Thursday 31 December 2026.
    name: "on a holiday",
    moment: "2026-12-31T03:00:00.000Z",
    warnings: [rulesOfJanuary4],
  },
  {
    // 10:00 WIB on Saturday 2 January 2027.
    name: "on a weekend",
    moment: "2027-01-02T03:00:00.000Z",
    warnings: [rulesOfJanuary4],
  },
  {
    // 10:00 WIB on Monday 4 January 2027.
    name: "on the trading day without a record",
    moment: "2027-01-04T03:00:00.000Z",
    warnings: [rulesOfJanuary4],
  },
  {
    // 10:00 WIB on Wednesday 6 January 2027, after the holiday of 5 January.
    name: "on the next trading day, which lacks the record too",
    moment: "2027-01-06T03:00:00.000Z",
    warnings: [
      "No recorded IDX rule for the auto rejection limits covers 2027-01-06, so add the rules that IDX set for that day to idx-rules-on.ts.",
    ],
  },
  {
    // 10:00 WIB on Friday 30 October 2026, before the first recorded broker fee.
    name: "on a trading day without a record of the costs",
    moment: "2026-10-30T03:00:00.000Z",
    warnings: [
      "No record of the broker fee covers 2026-10-30, so add the rates for that day to trading-costs.ts.",
    ],
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
  test(`${state.warnings.length > 0 ? "warns about the first trading day that lacks a record" : "gives no warning"} ${state.name}`, () => {
    expect(
      missingOrderDataWarnings(new Date(state.moment), delayMinutes),
    ).toEqual(state.warnings);
  });
}
