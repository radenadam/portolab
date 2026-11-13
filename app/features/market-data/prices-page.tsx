import type { ReactNode } from "react";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/prices-page";
import { PricesView } from "./prices-view";
import { readPrices } from "./read-prices.server";
import type { PricesOfView } from "./read-prices.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.market_data_page_title()) }];
}

export function loader({ context }: Route.LoaderArgs): PricesOfView {
  return readPrices(context, new Date());
}

export default function PricesPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return <PricesView {...loaderData} />;
}
