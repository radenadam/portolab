import { data, redirect } from "react-router";
import type { ReactNode } from "react";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { parseStockCode } from "~/features/trading/order-form-fields";
import { returnDestination } from "~/return-destination.server";
import { checkFieldLength } from "~/check-field-length";
import { fail } from "~/result";
import type { Result } from "~/result";
import { parseChoice } from "~/value-parsers";
import { setWatched } from "./watchlist-store.server";
import type { Route } from "./+types/watchlist-page";

const operations = ["add", "remove"] as const;
const operationMaximumLength = Math.max(
  ...operations.map((operation) => operation.length),
);
type Operation = (typeof operations)[number];
const watched: Record<Operation, boolean> = { add: true, remove: false };

function parseOperation(
  value: unknown,
  source: string,
): Result<Operation, string> {
  if (typeof value === "string") {
    const bounded = checkFieldLength(value, operationMaximumLength);
    if (!bounded.ok)
      return fail(
        `${source} must be add or remove, but it has ${String(bounded.failure)} characters, more than this input takes.`,
      );
  }
  return parseChoice(value, source, operations);
}

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
  const operation = parseOperation(params.operation, "operation");
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
        watched: watched[operation.value],
      },
      now,
    );
  });
  return redirect(returnTo);
}
