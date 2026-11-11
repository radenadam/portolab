import { addDays } from "~/calendar-dates";
import { isTradingDay } from "~/features/market-data/idx-calendar";
import { wibDateOf, wibMoment } from "~/wib";
import { orderTradingDay } from "./order-trading-day";

// Four weeks give the person who runs the server several weekends to update Portolab outside the sessions of IDX, even across a holiday of more than a week, such as Lebaran. A longer warning would mostly wait for IDX, which in 2026 announced each change of its auto rejection limits at most a week before it applied, as the sources in idx-rules-on.ts show.
const warningWeeks = 4;

/** The warning about the first date, from the date of a moment in WIB through the same day of the week some weeks later, for which Portolab cannot take an order because a record that the order needs is missing, such as the auto rejection limits of a trading day or the trading calendar of a year. It gives no warning when every date of those weeks has its records. */
export function missingOrderDataWarnings(
  now: Date,
  delayMinutes: number,
): string[] {
  const today = wibDateOf(now);
  const lastDate = addDays(today, warningWeeks * 7);
  for (let date = today; date <= lastDate; date = addDays(date, 1)) {
    const tradingDay = isTradingDay(date);
    if (!tradingDay.ok) {
      return [tradingDay.failure];
    }
    if (tradingDay.value) {
      // An order placed when its trading day begins trades on that day, so it needs every record of that day.
      const order = orderTradingDay(wibMoment(date, 0), delayMinutes);
      if (!order.ok) {
        return [order.failure.reason];
      }
    }
  }
  return [];
}
