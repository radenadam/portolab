import type { Database } from "~/database/database.server";
import type { JoinedClass } from "~/features/classes/class-store.server";
import { dismissHomeSince } from "~/features/classes/home-dismissal.server";
import { m } from "~/paraglide/messages.js";
import { succeed } from "~/result";
import type { Result } from "~/result";
import { homeSummaryTimeField } from "./home-summary-time";
import { parseHomeSummaryTime } from "./parse-home-summary-time";

export function closeHomeSummary(
  database: Database,
  form: FormData,
  {
    membershipId,
    joinedAt,
    now,
  }: Pick<JoinedClass, "membershipId" | "joinedAt"> & { now: Date },
): Result<void, string> {
  const shownAt = parseHomeSummaryTime(
    form.get(homeSummaryTimeField),
    m.trading_home_since_visit_title(),
    { joinedAt, now },
  );
  if (!shownAt.ok) return shownAt;
  dismissHomeSince(database, membershipId, shownAt.value);
  return succeed(undefined);
}
