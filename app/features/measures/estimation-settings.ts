import { startOfMonth } from "~/calendar-dates";

/** The choices that decide which monthly returns the measures use. */
export interface EstimationSettings {
  /** How many of the latest complete months the measures use, which is the number of returns of an instrument with a long enough history. */
  returnCount: number;
  /** The fewest returns in those months that the measures accept, which is at least 2, because a sample variance is not defined for fewer. */
  minimumReturnCount: number;
}

/** The settings that every measure uses, which decision 0013 explains. */
export const defaultEstimationSettings: EstimationSettings = {
  returnCount: 60,
  minimumReturnCount: 24,
};

/** The first date of the closes that the measures with these settings can need on a day, such as 2021-09-01 on 2026-11-01 for 60 monthly returns. The window needs the close of the month before its first return. The month of the day counts only once the market has closed in a later month, so the window can also end one month earlier, which needs one more close. */
export function earliestCloseDate(
  settings: EstimationSettings,
  today: string,
): string {
  return startOfMonth(today, -(settings.returnCount + 2));
}
