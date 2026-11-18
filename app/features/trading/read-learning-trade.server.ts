import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { listLatestQuotes } from "~/features/market-data/quote-store.server";
import { universeOn } from "~/features/market-data/tracked-instruments";
import { tradingHoursOn } from "~/features/market-data/idx-calendar";
import { wibDateOf } from "~/wib";
import { readTradingPortfolio } from "./read-trading-portfolio.server";
import { readTicket } from "./read-ticket.server";
import type { Portfolio } from "./portfolio-store.server";

export function readLearningTrade(
  context: Readonly<RouterContextProvider>,
  input: { request: Request; url: URL; classId: string; now: Date },
) {
  const { place, portfolio, source } = readTradingPortfolio(context, input);
  const database = context.get(databaseContext);
  const date = wibDateOf(input.now);
  const universe = universeOn(date);
  const quotes = listLatestQuotes(database).filter(
    (entry) =>
      entry.kind === "stock" &&
      universe.ok &&
      universe.value.includes(entry.code),
  );
  const quote = quotes.find((entry) => entry.code === "BBCA") ?? quotes[0];
  const code = quote?.code ?? (universe.ok ? universe.value[0] : undefined);
  const ticket =
    code === undefined
      ? undefined
      : readTicket(database, portfolio, {
          code,
          now: input.now,
          delayMinutes: source.delayMinutes,
        });
  const last = latestLearningTrade(portfolio);
  return {
    date,
    code,
    quote: ticket?.quote,
    quoteNotice: ticket?.quoteNotice,
    day: ticket?.day,
    range: ticket?.range,
    hours: tradingHoursOn(
      ticket?.day.ok === true ? ticket.day.value.date : date,
    ),
    source,
    last,
    portfolioKind: place.owner.kind,
  };
}

function latestLearningTrade(portfolio: Portfolio) {
  const filled = portfolio.orders.flatMap((order) =>
    order.state.kind === "filled"
      ? [
          {
            code: order.code,
            lots: order.lots,
            side: order.side,
            fill: order.state.fill,
          },
        ]
      : [],
  );
  return filled.toSorted(
    (first, second) =>
      second.fill.filledAt.getTime() - first.fill.filledAt.getTime(),
  )[0];
}
