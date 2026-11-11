import { addDays } from "~/calendar-dates";
import { isTradingDay } from "~/features/market-data/idx-calendar";
import { wibMoment } from "~/wib";
import { purchaseUniverseOn } from "./check-buyable";
import { orderTradingDay } from "./order-trading-day";

// Four weeks give the person who runs the server several weekends to update Portolab outside the sessions of IDX, even across a holiday of more than a week, such as Lebaran. A longer warning would mostly wait for IDX, which in 2026 announced each change of its auto rejection limits at most a week before it applied, and the review of the LQ45 for November a week before it applied, as the sources in idx-rules-on.ts and tracked-instruments.ts show.
const warningWeeks = 4;

/** The warnings about the dates, from a date in WIB through the same day of the week some weeks later, for which Portolab cannot take an order or a purchase because a record that it needs is missing. One warning names the first date for which every order fails, such as for the auto rejection limits of a trading day or the trading calendar of a year, and one names the first trading day that no period of the LQ45 covers, on which every purchase fails. It gives no warning when every date of those weeks has its records. The warnings depend only on the date, so they hold for the whole day. */
export function missingOrderDataWarnings(
  today: string,
  delayMinutes: number,
): string[] {
  const lastDate = addDays(today, warningWeeks * 7);
  let orderWarning: string | undefined;
  let purchaseWarning: string | undefined;
  for (let date = today; date <= lastDate; date = addDays(date, 1)) {
    const tradingDay = isTradingDay(date);
    if (!tradingDay.ok) {
      // An order fails once the search for its trading day reaches this date, and without a calendar the dates after it have no known trading days.
      orderWarning ??= tradingDay.failure;
      break;
    }
    if (tradingDay.value) {
      // An order placed when its trading day begins trades on that day, so it needs every record of that day.
      const order = orderTradingDay(wibMoment(date, 0), delayMinutes);
      if (orderWarning === undefined && !order.ok) {
        orderWarning = order.failure.reason;
      }
      const universe = purchaseUniverseOn(date);
      if (purchaseWarning === undefined && !universe.ok) {
        purchaseWarning = universe.failure.reason;
      }
    }
  }
  return [orderWarning, purchaseWarning].filter(
    (warning) => warning !== undefined,
  );
}
