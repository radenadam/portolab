import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Shares } from "~/units/shares";
import type { Order, OrderSide } from "./order";

/** The cash and the shares of each stock of a portfolio at the close of a day, which the fills of that day and the days before it leave. */
type Holdings = (date: string) => {
  cash: Rupiah;
  sharesByCode: ReadonlyMap<string, Shares>;
};

// The history asks for its days in order, so each fill applies once, at the close of its trading day.
export function replayPortfolioFills(
  startingCash: Rupiah,
  orders: readonly Order[],
): Holdings {
  const fills = filledOrders(orders);
  const sharesByCode = new Map<string, Shares>();
  let cash = startingCash;
  let filledCount = 0;
  return (date) => {
    for (const fill of fills.slice(filledCount)) {
      if (fill.tradingDay > date) {
        break;
      }
      cash = rupiah(cash + fill.cashChange);
      // A sale takes only shares that the fills before it bought, unless the person who runs the server deleted an order by hand, so the shares of a stock never fall below none.
      sharesByCode.set(
        fill.code,
        shares(
          Math.max(
            0,
            (sharesByCode.get(fill.code) ?? 0) +
              shareSigns[fill.side] * fill.shares,
          ),
        ),
      );
      filledCount += 1;
    }
    return { cash, sharesByCode };
  };
}

const shareSigns: Record<OrderSide, 1 | -1> = { buy: 1, sell: -1 };

interface HistoryFill {
  code: string;
  side: OrderSide;
  shares: Shares;
  tradingDay: string;
  cashChange: Rupiah;
}

// The fills of each day apply together at its close, so only the order of the days matters.
function filledOrders(orders: readonly Order[]): HistoryFill[] {
  const fills: HistoryFill[] = [];
  for (const order of orders) {
    if (order.state.kind === "filled") {
      fills.push({
        code: order.code,
        side: order.side,
        shares: order.shares,
        tradingDay: order.tradingDay,
        cashChange: order.state.fill.cashChange,
      });
    }
  }
  return fills.sort((first, second) =>
    first.tradingDay.localeCompare(second.tradingDay),
  );
}
