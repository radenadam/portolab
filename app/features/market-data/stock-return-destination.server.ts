import type { Role } from "~/features/accounts/accounts.schema";
import type { ClassId } from "~/features/classes/classes.schema";
import { measuresPath } from "~/features/measures/measures-path";
import { m } from "~/paraglide/messages.js";
import { returnDestination } from "~/return-destination.server";
import { marketPath } from "./market-path";

/** A stock can be opened from either list, but its return must stay inside the reader's class. */
export function stockReturnDestination({
  classId,
  role,
  url,
  request,
}: {
  classId: ClassId;
  role: Role;
  url: URL;
  request: Request;
}) {
  const destination = new URL(
    returnDestination(url.searchParams.get("returnTo"), request),
    url,
  );
  const analysis =
    destination.pathname === measuresPath(classId) && role === "student";
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
