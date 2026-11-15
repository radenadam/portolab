import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Rupiah } from "~/units/rupiah";
import { rupiah } from "~/units/rupiah";
import { lots } from "~/units/lots";
import type { OrderTradingDay } from "./order-trading-day";
import { ticketQuickLots } from "./ticket-quick-lots";

export function stockImpactLots({
  total,
  available,
  share,
  price,
  day,
}: {
  total: Rupiah;
  available: Rupiah;
  share: PortfolioWeight;
  price: Rupiah;
  day: OrderTradingDay;
}) {
  return ticketQuickLots("buy", 1, {
    available: rupiah(Math.min(available, Math.floor(total * share))),
    free: lots(0),
    price,
    day,
  });
}
