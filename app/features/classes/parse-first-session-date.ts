import { addDays, startOfUtcDate, utcDateOf } from "~/calendar-dates";
import { checkFieldLengthForReader } from "~/form-text";
import { formatCalendarDate, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { typeName } from "~/value-shapes";
import { wibDateOf } from "~/wib";
import { firstSessionReachDays } from "./class-rules";

/** Reads the date of session 1 of a class from its field, as a calendar date such as 2026-09-07, which lies at most firstSessionReachDays before or after the day of the moment in WIB. The source is the label of the field, and the failure is a sentence for the reader in the current language. */
export function parseFirstSessionDate(
  value: unknown,
  source: string,
  now: Date,
): Result<string, string> {
  // Only a forged form leaves the field out.
  if (value === null) {
    return fail(m.classes_no_first_session_error({ field: source }));
  }
  if (typeof value !== "string") {
    return fail(m.app_not_text_error({ field: source, type: typeName(value) }));
  }
  const checked = checkFieldLengthForReader(value, source);
  if (!checked.ok) {
    return checked;
  }
  const date = value.trim();
  // A field of a date sends an empty text while it lacks a day, a month, or a year, or holds a day that its month lacks.
  if (date === "") {
    return fail(m.classes_no_first_session_error({ field: source }));
  }
  // Every current browser sends the date of a field of a date in this form, whatever the language that it shows, so another text comes only from a forged form.
  if (!isCalendarDate(date)) {
    return fail(m.classes_not_date_error({ field: source, value: date }));
  }
  const today = wibDateOf(now);
  const earliest = addDays(today, -firstSessionReachDays);
  const latest = addDays(today, firstSessionReachDays);
  if (date < earliest || date > latest) {
    // A field of a date shows its date in the format of the device, which the server cannot know, so the failure writes the date as Portolab writes every date in the language of the reader.
    return fail(
      m.classes_first_session_range_error({
        field: source,
        earliest: formatCalendarDate(earliest),
        latest: formatCalendarDate(latest),
        value: formatCalendarDate(date),
        days: formatNumber(firstSessionReachDays),
      }),
    );
  }
  return succeed(date);
}

/** Whether a text is a calendar date that exists, such as 2026-09-07. */
function isCalendarDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  // JavaScript reads a day that a month lacks, such as 2026-02-30, as a day of the next month, so only a date that reads back as itself exists.
  const moment = startOfUtcDate(text);
  return !Number.isNaN(moment.getTime()) && utcDateOf(moment) === text;
}
