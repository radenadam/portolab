import { data, redirect } from "react-router";
import type { ReactNode } from "react";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { parseStockCode } from "~/features/trading/order-form-fields";
import { returnDestination } from "~/return-destination.server";
import { parseChoice } from "~/value-parsers";
import { setWatched } from "./watchlist-store.server";
import { watchedAfter, watchlistOperations } from "./watchlist-path";
import type { Route } from "./+types/watchlist-page";

export function loader() {
  throw data(null, { status: 404 });
}

/** Its GET refusal needs the app's HTML error boundary, so this remains a page route. */
export default function WatchlistPage(): ReactNode {
  return null;
}

export async function action({
  context,
  params,
  request,
  url,
}: Route.ActionArgs) {
  const form = await request.formData();
  const returnTo = returnDestination(form.get("returnTo"), request);
  // A session that ends must return to the reader's work after sign-in, rather than to a POST-only address.
  const source = new URL(returnTo, url);
  const reader = requireUser(context, source);
  const code = parseStockCode(params.code, "code", trackedStockCodes);
  const operation = parseChoice(
    params.operation,
    "operation",
    watchlistOperations,
  );
  if (!code.ok || !operation.ok) throw data(null, { status: 404 });
  const now = new Date();
  const database = context.get(databaseContext);
  database.transaction(() => {
    requireReaderClass(context, source, params.classId);
    setWatched(
      database,
      {
        userId: reader.id,
        code: code.value,
        watched: watchedAfter[operation.value],
      },
      now,
    );
  });
  return redirect(returnTo);
}
