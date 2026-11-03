import { formatNumber } from "~/formatting";
import { singularOrPlural } from "~/sentences";

/** The two messages of a text whose grammar changes with a count, one for 1 and one for several. Each takes the inputs of the text and the count as formatNumber writes it, and a message may leave the count out. */
export interface CountedMessages<Inputs> {
  one: (inputs: Inputs & { count: string }) => string;
  several: (inputs: Inputs & { count: string }) => string;
}

/** The text for a count in the active language, from the message for 1 or the message for several, because English changes its grammar between them. */
export function countedText<Inputs extends object>(
  count: number,
  messages: CountedMessages<Inputs>,
  inputs: Inputs,
): string {
  const message = singularOrPlural(count, messages.one, messages.several);
  return message({ ...inputs, count: formatNumber(count) });
}
