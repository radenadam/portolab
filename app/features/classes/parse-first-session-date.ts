import { addDays, startOfUtcDate, utcDateOf } from "~/calendar-dates";
import { checkFieldLengthForReader } from "~/form-text";
import { formatCalendarDate, formatNumber, formatUtcDay } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { typeName } from "~/value-shapes";
import { wibDateOf } from "~/wib";
import { firstSessionReachDays } from "./class-rules";

// A field of a date sends its date as the HTML standard writes it, such as 2026-09-07, whatever the language that it shows. The standard gives the year four or more digits, and Chromium sends a year of six digits that a reader typed, such as 202666-09-07.
const fieldDatePattern = /^(\d{4,})-(\d{2})-(\d{2})$/;

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
  const text = value.trim();
  // A field of a date sends an empty text while it lacks a day, a month, or a year, or holds a day that its month lacks.
  if (text === "") {
    return fail(m.classes_no_first_session_error({ field: source }));
  }
  const day = readFieldDate(text);
  if (day === undefined) {
    return fail(m.classes_not_date_error({ field: source, value: text }));
  }
  const today = wibDateOf(now);
  const earliest = addDays(today, -firstSessionReachDays);
  const latest = addDays(today, firstSessionReachDays);
  if (
    day.getTime() < startOfUtcDate(earliest).getTime() ||
    day.getTime() > startOfUtcDate(latest).getTime()
  ) {
    // A field of a date shows its date in the format of the device, which the server cannot know, so the failure writes the date as Portolab writes every date in the language of the reader.
    return fail(
      m.classes_first_session_range_error({
        field: source,
        earliest: formatCalendarDate(earliest),
        latest: formatCalendarDate(latest),
        value: formatUtcDay(day),
        days: formatNumber(firstSessionReachDays),
      }),
    );
  }
  return succeed(utcDateOf(day));
}

/** The start in UTC of the day that a field of a date sent, or undefined for a text that names no day of the calendar. */
function readFieldDate(text: string): Date | undefined {
  const parts = fieldDatePattern.exec(text);
  if (parts === null) {
    return undefined;
  }
  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const dayOfMonth = Number(parts[3]);
  // Date.UTC would read a year below 100 as a year of the twentieth century, and setUTCFullYear reads it as written.
  const day = new Date(0);
  day.setUTCFullYear(year, month - 1, dayOfMonth);
  // JavaScript moves a day that a month lacks, such as 2026-02-30, into the next month, and it holds no day after 13 September 275760, so only a day that reads back as written exists. The HTML standard counts the years from 1.
  const exists =
    year >= 1 &&
    day.getUTCFullYear() === year &&
    day.getUTCMonth() === month - 1 &&
    day.getUTCDate() === dayOfMonth;
  return exists ? day : undefined;
}
