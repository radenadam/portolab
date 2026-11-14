import { data, redirect } from "react-router";
import { findStudentPlace } from "./find-student-place.server";
import { parseStockCode, parseOrderSide } from "./order-form-fields";
import { ordersPath } from "./orders-path";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import type { Route } from "./+types/stock-ticket-fallback";

/** Piece 14 replaces this fallback with the docked ticket at the same address. */
export function loader({ context, params, url }: Route.LoaderArgs): Response {
  const place = findStudentPlace(context, url, params.classId);
  const code = parseStockCode(params.code, "code", trackedStockCodes);
  const side = parseOrderSide(params.side, "side");
  if (!code.ok || !side.ok) throw data(null, { status: 404 });
  return redirect(
    `${ordersPath(place.classId)}?code=${code.value}&side=${side.value}`,
  );
}
