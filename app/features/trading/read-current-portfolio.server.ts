import type { Database } from "~/database/database.server";
import { isLoadedByAnotherSite } from "~/is-loaded-by-another-site.server";
import { checkPortfolioOrders } from "./check-open-orders.server";
import { readPortfolio } from "./portfolio-store.server";
import type { Portfolio, PortfolioOwner } from "./portfolio-store.server";

/** The portfolio of an owner for a page that a request loads at a moment, after a check of its open orders, so the page shows a fill that a delayed price brought since the price job last checked them. */
export function readCurrentPortfolio(
  database: Database,
  owner: PortfolioOwner,
  { request, now }: { request: Request; now: Date },
): Portfolio {
  // A page of another site can make a browser load this address without its reader opening it, so only a visit of the reader, the student or the lecturer of the class, checks the orders.
  if (!isLoadedByAnotherSite(request)) {
    database.transaction((transaction) => {
      checkPortfolioOrders(transaction, owner.membershipId, now);
    });
  }
  return readPortfolio(database, owner);
}
