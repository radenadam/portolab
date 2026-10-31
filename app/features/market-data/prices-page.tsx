import type { ReactNode } from "react";
import { databaseContext } from "~/database/database.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/prices-page";
import type { Quote } from "./price-source.server";
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
} {
  const database = context.get(databaseContext);
  return {
    quotes: listLatestQuotes(database),
    latestAttempt: readLatestUpdateAttempt(database),
  };
}

export default function PricesPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return (
    <PricesView
      quotes={loaderData.quotes}
      latestAttempt={loaderData.latestAttempt}
    />
  );
}
