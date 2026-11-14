import { getLocale } from "./paraglide/runtime.js";

// The degrees of a person follow the name after a comma, such as "Ratna Wulandari, S.E., M.M.", and a title before the name ends in a period, such as "Dr.".
const degreeSeparator = ",";
const titleEnd = ".";
const initialCount = 2;

/** The initials of the name of a person for the avatar of the frame: the first letter of each of the first two words of the name, in capitals, leaving out a title before the name and the degrees after it. A name of titles alone gives the first letter of the name. */
export function initialsOf(name: string): string {
  const [person = ""] = name.split(degreeSeparator);
  const words = person
    .split(/\s+/)
    .filter((word) => word !== "" && !word.endsWith(titleEnd));
  const chosen = words.length > 0 ? words.slice(0, initialCount) : [name];
  let initials = "";
  for (const word of chosen) {
    initials += firstLetter(word.trim());
  }
  return initials.toLocaleUpperCase(getLocale());
}

// A letter can be several code points, such as a letter with an accent that follows it.
function firstLetter(word: string): string {
  const letters = new Intl.Segmenter(getLocale(), {
    granularity: "grapheme",
  }).segment(word);
  for (const letter of letters) {
    return letter.segment;
  }
  return "";
}
