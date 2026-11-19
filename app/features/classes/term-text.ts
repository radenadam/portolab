import { formatCalendarDatePart } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Term } from "./course-calendar";

const termMessages: Record<
  Term["semester"],
  (years: { firstYear: string; secondYear: string }) => string
> = {
  odd: m.classes_odd_term_label,
  even: m.classes_even_term_label,
};

/** The name of the term of a class with its academic year in the active language, which stands alone beside the name of the class, such as "Ganjil 2026/2027". */
export function termText(term: Term): string {
  return termMessages[term.semester]({
    firstYear: formatCalendarDatePart(term.academicYear.from, "year"),
    secondYear: formatCalendarDatePart(term.academicYear.until, "year"),
  });
}
