import { addDays, startOfMonth, startOfWeek } from "~/calendar-dates";
import type { ReturnFrequency } from "./return-frequency";

/** The choices that decide which returns the measures use. */
export interface EstimationSettings {
  frequency: ReturnFrequency;
  /** How many of the latest complete periods the measures use, which is the number of returns of an instrument with a long enough history. */
  returnCount: number;
  /** The fewest returns in those periods that the measures accept, which is at least 2, because a variance divides by one less than the number of returns. */
  minimumReturnCount: number;
}

/** The settings that every measure uses, which decision 0013 explains. */
export const defaultEstimationSettings: EstimationSettings = {
  frequency: "monthly",
  returnCount: 60,
  minimumReturnCount: 24,
};

/** The first date whose close the measures with these settings can need on a day, such as 2021-09-01 on 2026-11-01 for 60 monthly returns. The window needs the close of the period before its first return. The period of the day counts only once the market has closed in a later one, so the window can also end one period earlier, which needs one more close. */
export function earliestCloseDate(
  settings: EstimationSettings,
  today: string,
): string {
  const periodsBack = settings.returnCount + 2;
  switch (settings.frequency) {
    case "monthly":
      return startOfMonth(today, -periodsBack);
    case "weekly":
      return addDays(startOfWeek(today), -7 * periodsBack);
  }
}
