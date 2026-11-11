import { afterEach, expect, test, vi } from "vitest";
import { writeLog } from "~/write-log.server";
import { dailyWarningLog } from "./daily-warning-log.server";

// The log is replaced, so a test can read the warnings that reach it.
vi.mock("~/write-log.server");

afterEach(() => {
  vi.mocked(writeLog).mockClear();
});

// The warnings are those that the trading feature gives on Saturday 30 and Sunday 31 January 2027, with the data recorded today.
const rulesOfFebruary1 =
  "No recorded IDX rule for the auto rejection limits covers 2027-02-01, so add the rules that IDX set for that day to idx-rules-on.ts.";
const lq45OfFebruary1 =
  "No recorded period of the LQ45 covers 2027-02-01, so add the stocks of the LQ45 that IDX set for that day to tracked-instruments.ts.";

test("writes every warning of a date in WIB once, and again from the first minute of the next date", () => {
  const askedDates: string[] = [];
  const logWarnings = dailyWarningLog((date) => {
    askedDates.push(date);
    return [rulesOfFebruary1, lq45OfFebruary1];
  });
  // 00:00 and 23:59 WIB on Saturday 30 January 2027.
  logWarnings(new Date("2027-01-29T17:00:00.000Z"));
  logWarnings(new Date("2027-01-30T16:59:00.000Z"));
  expect(askedDates).toEqual(["2027-01-30"]);
  expect(vi.mocked(writeLog).mock.calls).toEqual([
    ["warning", rulesOfFebruary1],
    ["warning", lq45OfFebruary1],
  ]);
  // 00:00 WIB on Sunday 31 January 2027.
  logWarnings(new Date("2027-01-30T17:00:00.000Z"));
  expect(askedDates).toEqual(["2027-01-30", "2027-01-31"]);
  expect(vi.mocked(writeLog).mock.calls).toEqual([
    ["warning", rulesOfFebruary1],
    ["warning", lq45OfFebruary1],
    ["warning", rulesOfFebruary1],
    ["warning", lq45OfFebruary1],
  ]);
});
