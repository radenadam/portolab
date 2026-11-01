import type { ReactNode } from "react";
import { databaseContext } from "~/database/database.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/prices-page";
import { priceSourceContext } from "./price-source-context.server";
import type { PriceSourceDescription, Quote } from "./price-source.server";
import { PricesView } from "./prices-view";
import {
  listLatestQuotes,
  readLatestUpdateAttempt,
} from "./quote-store.server";
import type { UpdateAttempt } from "./quote-store.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.market_data_page_title()) }];
}

export function loader({ context }: Route.LoaderArgs): {
  quotes: Quote[];
  latestAttempt: UpdateAttempt | undefined;
  now: Date;
  source: PriceSourceDescription;
} {
  const database = context.get(databaseContext);
  const priceSource = context.get(priceSourceContext);
  return {
    quotes: listLatestQuotes(database),
    latestAttempt: readLatestUpdateAttempt(database),
    // The server's clock decides the text, so the page that the browser takes over says the same.
    now: new Date(),
    source: { name: priceSource.name, delayMinutes: priceSource.delayMinutes },
  };
}

export default function PricesPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return (
    <PricesView
      quotes={loaderData.quotes}
      latestAttempt={loaderData.latestAttempt}
      now={loaderData.now}
      source={loaderData.source}
    />
  );
}
