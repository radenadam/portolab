import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { measuresPath } from "~/features/measures/measures-path";
import { m } from "~/paraglide/messages.js";
import { returnDestination } from "~/return-destination.server";
import { marketPath } from "./market-path";

/** A stock can be opened from either list, but its return must stay inside the reader's class. */
export function stockReturnDestination({
  classId,
  portfolioKind,
  url,
  request,
}: {
  classId: ClassId;
  portfolioKind: PortfolioKind;
  url: URL;
  request: Request;
}) {
  const destination = new URL(
    returnDestination(url.searchParams.get("returnTo"), request),
    url,
  );
  const analysis =
    destination.pathname === measuresPath(classId, portfolioKind);
  const returnTo =
    destination.pathname === marketPath(classId) || analysis
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : undefined;
  return {
    returnTo,
    returnPath: returnTo ?? marketPath(classId),
    returnLabel: analysis
      ? m.market_data_back_to_analysis_link()
      : m.market_data_back_to_market_link(),
  };
}
