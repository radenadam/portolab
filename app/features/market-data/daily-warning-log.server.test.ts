import { afterEach, expect, test, vi } from "vitest";
import { writeLog } from "~/write-log.server";
import { dailyWarningLog } from "./daily-warning-log.server";

// The log is replaced, so a test can read the warnings that reach it.
vi.mock("~/write-log.server");

afterEach(() => {
  vi.mocked(writeLog).mockClear();
});

// The warnings are those that the price job gives at these moments, with the data recorded today.
const rulesOfJanuary4 =
  "No recorded IDX rule for the auto rejection limits covers 2027-01-04, so add the rules that IDX set for that day to idx-rules-on.ts.";
const rulesOfFebruary1 =
  "No recorded IDX rule for the auto rejection limits covers 2027-02-01, so add the rules that IDX set for that day to idx-rules-on.ts.";
const lq45OfFebruary1 =
  "No recorded period of the LQ45 covers 2027-02-01, so add the stocks of the latest review of IDX to tracked-instruments.ts.";

test("writes a warning once on a date in WIB, and again from the first minute of the next date", () => {
  const logWarnings = dailyWarningLog();
  // 00:00 and 23:59 WIB on Monday 7 December 2026.
  logWarnings(new Date("2026-12-06T17:00:00.000Z"), [rulesOfJanuary4]);
  logWarnings(new Date("2026-12-07T16:59:00.000Z"), [rulesOfJanuary4]);
  expect(vi.mocked(writeLog).mock.calls).toEqual([
    ["warning", rulesOfJanuary4],
  ]);
  // 00:00 WIB on Tuesday 8 December 2026.
  logWarnings(new Date("2026-12-07T17:00:00.000Z"), [rulesOfJanuary4]);
  expect(vi.mocked(writeLog).mock.calls).toEqual([
    ["warning", rulesOfJanuary4],
    ["warning", rulesOfJanuary4],
  ]);
});

test("writes a warning that arrives later on a date when it arrives, and each of them once", () => {
  const logWarnings = dailyWarningLog();
  // At 00:00 WIB on Monday 1 February 2027, before the price hours, and at 08:45 and 16:25 WIB, within them, when the price job also warns about the LQ45.
  logWarnings(new Date("2027-01-31T17:00:00.000Z"), [rulesOfFebruary1]);
  expect(vi.mocked(writeLog).mock.calls).toEqual([
    ["warning", rulesOfFebruary1],
  ]);
  logWarnings(new Date("2027-02-01T01:45:00.000Z"), [
    lq45OfFebruary1,
    rulesOfFebruary1,
  ]);
  logWarnings(new Date("2027-02-01T09:25:00.000Z"), [
    lq45OfFebruary1,
    rulesOfFebruary1,
  ]);
  expect(vi.mocked(writeLog).mock.calls).toEqual([
    ["warning", rulesOfFebruary1],
    ["warning", lq45OfFebruary1],
  ]);
});
