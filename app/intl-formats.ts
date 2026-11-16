// Node and each browser ship their own data and code for Intl, so the same format can write a different space in the same text, such as before AM or PM, where CLDR 42 changed the plain space to a narrow no-break space. React rejects the markup of the server when a text differs from the text that the browser renders, so every format here writes one kind of space whatever the engine writes.
const spaces = /\p{Zs}/gu;

// A number stays on one line with its sign, currency, and unit, as the section Interface text of AGENTS.md requires.
const numberSpace = "\u00a0";

// A date, a time, or a list keeps the plain spaces of a sentence, so its layout decides where it may break, such as between a day and its time in a narrow cell of a table.
const wordSpace = " ";

/** A format of Intl whose text is the same on the server and in every browser. */
interface SameTextFormat<Value, Part> {
  format: (value: Value) => string;
  formatToParts: (value: Value) => Part[];
}

/** Formats numbers as Intl.NumberFormat does, with a no-break space wherever Intl writes a space, such as in IDR 1.2M or 10 menit. */
export function numberFormat(
  locale: string,
  options: Intl.NumberFormatOptions,
): SameTextFormat<number, Intl.NumberFormatPart> {
  const format = new Intl.NumberFormat(locale, options);
  return {
    format: (value) => format.format(value).replaceAll(spaces, numberSpace),
    formatToParts: (value) =>
      partsWithSpace(format.formatToParts(value), numberSpace),
  };
}

/** Formats moments as Intl.DateTimeFormat does, with a plain space wherever Intl writes a space, such as in Nov 17, 2026, 4:13 PM. */
export function dateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): SameTextFormat<Date, Intl.DateTimeFormatPart> {
  const format = new Intl.DateTimeFormat(locale, options);
  return {
    format: (moment) => format.format(moment).replaceAll(spaces, wordSpace),
    formatToParts: (moment) =>
      partsWithSpace(format.formatToParts(moment), wordSpace),
  };
}

/** Joins words into a list as Intl.ListFormat does, with a plain space wherever Intl writes a space between the words. */
export function listFormat(
  locale: string,
  type: Intl.ListFormatType,
): { format: (words: readonly string[]) => string } {
  const format = new Intl.ListFormat(locale, { type });
  return {
    format: (words) => {
      let text = "";
      for (const part of format.formatToParts(words)) {
        // The words are the caller's, such as amounts with their no-break spaces, so they keep their spaces.
        text +=
          part.type === "element"
            ? part.value
            : part.value.replaceAll(spaces, wordSpace);
      }
      return text;
    },
  };
}

function partsWithSpace<Part extends { value: string }>(
  parts: readonly Part[],
  space: string,
): Part[] {
  const spaced: Part[] = [];
  for (const part of parts) {
    spaced.push({ ...part, value: part.value.replaceAll(spaces, space) });
  }
  return spaced;
}
