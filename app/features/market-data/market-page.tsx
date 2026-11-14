import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import type { Route } from "./+types/market-page";
import { readPrices } from "./read-prices.server";
import type { PricesOfView } from "./read-prices.server";

// The market of a class shows the table of the prices until the change of issue #127 that rebuilds Pasar.
export { default, meta } from "./prices-page";

/** The prices for the lecturer and the students of a class. Every other reader gets the page of an address that does not exist. */
export function loader({
  context,
  params,
  url,
}: Route.LoaderArgs): PricesOfView {
  requireReaderClass(context, url, params.classId);
  return readPrices(context, new Date());
}
