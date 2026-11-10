import { addDays, startOfMonth } from "~/calendar-dates";
import type {
  ClosePrice,
  DailyClose,
} from "~/features/market-data/price-source.server";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { countReturns } from "./aligned-returns";
import type { InstrumentCloses } from "./aligned-returns";
import type { EstimationSettings } from "./estimation-settings";

/**
 * The first day of the month whose first trading day completes the month that gives the market and instruments, which share fewer monthly returns than the minimum of the settings, as many as the minimum, if the market and each instrument keep a close at the end of every month after the window end. It counts with countReturns on the closes that each later month adds, because a month that enters the window pushes out its oldest month, which can hold a return.
 * It fails, and names the instrument, while the market has no complete month or an instrument has no close, because the closes that the later months add repeat the latest close of each.
 */
export function forecastEnoughReturns(
  instruments: readonly InstrumentCloses[],
  market: InstrumentCloses,
  settings: EstimationSettings,
): Result<string, { code: string }> {
  const { windowEnd } = countReturns(instruments, market, settings);
  const latestLevel = market.closes.at(-1);
  if (windowEnd === undefined || latestLevel === undefined) {
    return fail({ code: market.code });
  }
  const forecasts: {
    code: string;
    latestClose: ClosePrice;
    closes: DailyClose<ClosePrice>[];
  }[] = [];
  for (const instrument of instruments) {
    const latestClose = instrument.closes.at(-1);
    if (latestClose === undefined) {
      return fail({ code: instrument.code });
    }
    forecasts.push({
      code: instrument.code,
      latestClose: latestClose.close,
      closes: [...instrument.closes],
    });
  }
  const levels = [...market.closes];
  // After a whole window of later months, the window holds only months in which every instrument keeps a close, so the count reaches the number of returns of the settings, which is at least the minimum.
  for (let months = 1; months <= settings.returnCount + 1; months += 1) {
    const nextMonth = startOfMonth(windowEnd, months + 1);
    const monthEnd = addDays(nextMonth, -1);
    levels.push({ date: monthEnd, close: latestLevel.close });
    for (const forecast of forecasts) {
      forecast.closes.push({ date: monthEnd, close: forecast.latestClose });
    }
    // The market completes a month once it has a close in the next month.
    const counted = countReturns(
      forecasts.map(({ code, closes }) => ({ code, closes })),
      {
        code: market.code,
        closes: [...levels, { date: nextMonth, close: latestLevel.close }],
      },
      settings,
    );
    if (counted.count >= counted.minimum) {
      return succeed(nextMonth);
    }
  }
  throw new Error(
    `The minimum of ${String(settings.minimumReturnCount)} returns must not exceed the ${String(settings.returnCount)} returns of the window, but no later month gives enough to ${market.code} and ${String(instruments.length)} instruments.`,
  );
}
