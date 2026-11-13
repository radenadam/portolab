import { formatCalendarDatePart } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Term } from "./course-calendar";

/** Where the name of a term stands: inside a sentence, such as "Kelas ini termasuk semester Ganjil 2026/2027", or alone beside the name of a class, such as "Ganjil 2026/2027". */
export type TermPlace = "inSentence" | "alone";

type TermMessage = (years: { firstYear: string; secondYear: string }) => string;

const termMessages: Record<TermPlace, Record<Term["semester"], TermMessage>> = {
  inSentence: {
    odd: m.classes_odd_term_part,
    even: m.classes_even_term_part,
  },
  alone: {
    odd: m.classes_odd_term_label,
    even: m.classes_even_term_label,
  },
};

/** The name of the term of a class with its academic year, in the active language. */
export function termText(term: Term, place: TermPlace): string {
  return termMessages[place][term.semester]({
    firstYear: formatCalendarDatePart(term.academicYear.from, "year"),
    secondYear: formatCalendarDatePart(term.academicYear.until, "year"),
  });
}
