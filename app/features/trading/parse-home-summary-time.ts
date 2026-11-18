import { checkFieldLength } from "~/check-field-length";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { describeValue, isValidDate, typeName } from "~/value-shapes";
import { homeSummaryTimeMaximumLength } from "./home-summary-time";

export function parseHomeSummaryTime(
  value: unknown,
  source: string,
  { joinedAt, now }: { joinedAt: Date; now: Date },
): Result<Date, string> {
  if (value === null || value === undefined || value === "")
    return timeFailure(source, m.trading_home_since_missing_time_part());
  if (typeof value !== "string")
    return timeFailure(
      source,
      m.trading_home_since_time_type_part({ type: typeName(value) }),
    );
  const checked = checkFieldLength(value, homeSummaryTimeMaximumLength);
  if (!checked.ok)
    return timeFailure(
      source,
      m.trading_home_since_long_time_part({
        length: formatNumber(checked.failure),
      }),
    );
  const text = value.trim();
  if (text === "")
    return timeFailure(source, m.trading_home_since_missing_time_part());
  const moment = new Date(text);
  if (
    !isValidDate(moment) ||
    moment.toISOString() !== text ||
    moment < joinedAt ||
    moment > now
  )
    return timeFailure(
      source,
      m.trading_home_since_invalid_time_part({ value: describeValue(text) }),
    );
  return succeed(moment);
}

function timeFailure(source: string, problem: string): Result<never, string> {
  return fail(m.trading_home_since_time_error({ source, problem }));
}
