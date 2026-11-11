import { expect, test } from "vitest";
import { missingOrderDataWarnings } from "./missing-order-data-warnings";

// An order expires when the prices of its trading day become final, which depends on the delay of the price source.
const delayMinutes = 10;

function rulesOf(date: string): string {
  return `No recorded IDX rule for the auto rejection limits covers ${date}, so add the rules that IDX set for that day to idx-rules-on.ts.`;
}

function lq45Of(date: string): string {
  return `No recorded period of the LQ45 covers ${date}, so add the stocks of the LQ45 that IDX set for that day to tracked-instruments.ts.`;
}

// Each date, with the warnings that it gives. The recorded auto rejection limits end on Thursday 31 December 2026, so Monday 4 January 2027 is the first trading day without them, which the coming weeks reach from Monday 7 December 2026. The recorded period of the LQ45 ends on Friday 29 January 2027, so Monday 1 February 2027 is the first trading day that no period covers, which the coming weeks reach from Monday 4 January 2027.
const warningStates: { name: string; date: string; warnings: string[] }[] = [
  {
    name: "on a trading day whose coming weeks have every record",
    date: "2026-11-02",
    warnings: [],
  },
  {
    name: "on the last date before the coming weeks reach a trading day without a rule",
    date: "2026-12-06",
    warnings: [],
  },
  {
    name: "from the first date on which the coming weeks reach that day",
    date: "2026-12-07",
    warnings: [rulesOf("2027-01-04")],
  },
  {
    name: "on a Friday",
    date: "2026-12-11",
    warnings: [rulesOf("2027-01-04")],
  },
  {
    name: "on the last trading day before that day",
    date: "2026-12-30",
    warnings: [rulesOf("2027-01-04")],
  },
  {
    name: "on a holiday",
    date: "2026-12-31",
    warnings: [rulesOf("2027-01-04")],
  },
  {
    name: "on a weekend",
    date: "2027-01-02",
    warnings: [rulesOf("2027-01-04")],
  },
  {
    name: "on the last date before the coming weeks reach a trading day without a period of the LQ45",
    date: "2027-01-03",
    warnings: [rulesOf("2027-01-04")],
  },
  {
    name: "from the first date on which the coming weeks reach that day, which is a trading day without a rule",
    date: "2027-01-04",
    warnings: [rulesOf("2027-01-04"), lq45Of("2027-02-01")],
  },
  {
    // 5 January 2027 is a holiday.
    name: "on the next trading day, which lacks a rule too",
    date: "2027-01-06",
    warnings: [rulesOf("2027-01-06"), lq45Of("2027-02-01")],
  },
  {
    name: "on the last trading day of the period of the LQ45, which is a Friday",
    date: "2027-01-29",
    warnings: [rulesOf("2027-01-29"), lq45Of("2027-02-01")],
  },
  {
    name: "on the weekend before the trading day without a period",
    date: "2027-01-30",
    warnings: [rulesOf("2027-02-01"), lq45Of("2027-02-01")],
  },
  {
    name: "on the trading day without a period",
    date: "2027-02-01",
    warnings: [rulesOf("2027-02-01"), lq45Of("2027-02-01")],
  },
  {
    // Friday 30 October 2026 comes before the first recorded broker fee and the first recorded period of the LQ45.
    name: "on a trading day without a record of the costs or a period of the LQ45",
    date: "2026-10-30",
    warnings: [
      "No record of the broker fee covers 2026-10-30, so add the rates for that day to trading-costs.ts.",
      lq45Of("2026-10-30"),
    ],
  },
  {
    // No calendar covers 1 January 2028, which the coming weeks of this date reach after trading days without a rule and a period.
    name: "on a date whose coming weeks reach a date that no calendar covers",
    date: "2027-12-20",
    warnings: [rulesOf("2027-12-20"), lq45Of("2027-12-20")],
  },
  {
    name: "on a date that no calendar covers",
    date: "2028-01-03",
    warnings: [
      "No IDX trading calendar covers 2028-01-03, so add the holidays and trading hours of that year to idx-calendar.ts.",
    ],
  },
];

for (const state of warningStates) {
  test(`${state.warnings.length > 0 ? "warns about the first date that lacks each record" : "gives no warning"} ${state.name}`, () => {
    expect(missingOrderDataWarnings(state.date, delayMinutes)).toEqual(
      state.warnings,
    );
  });
}
