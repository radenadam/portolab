import type { Database } from "~/database/database.server";
import { succeed } from "~/result";
import type { Result } from "~/result";
import { orderDayOf } from "./order-form";
import type { OrderDay } from "./order-form";
import { orderTradingDay } from "./order-trading-day";
import type { TradingDayFailure } from "./order-trading-day";
import { readStockChoice } from "./read-stock-choice.server";
import type { StockChoice } from "./read-stock-choice.server";

/** What the order ticket of a page shows: the trading day of an order placed now, or why Portolab cannot check an order against it, and the stock that the address of the page chose. */
export interface OrderTicket {
  day: Result<OrderDay, TradingDayFailure>;
  choice: StockChoice;
}

/** Reads the order ticket of a page at a moment, with the stock that the address of the page chose. The url is the one that React Router gives a loader. */
export function readOrderTicket(
  database: Database,
  { url, now, delayMinutes }: { url: URL; now: Date; delayMinutes: number },
): OrderTicket {
  const day = orderTradingDay(now, delayMinutes);
  return {
    day: day.ok ? succeed(orderDayOf(day.value)) : day,
    // While the trading day lacks a record, the ticket offers no order and so chooses no stock for one.
    choice: day.ok
      ? readStockChoice(database, url.searchParams.get("code"))
      : { kind: "choosing", failure: undefined },
  };
}

/** The status of a page with an order ticket, which is a wrong value when its address chose a stock that Portolab does not trade. */
export function orderTicketStatus(ticket: OrderTicket): number {
  return ticket.choice.kind === "choosing" &&
    ticket.choice.failure !== undefined
    ? 400
    : 200;
}
