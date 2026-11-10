import { marketIndex } from "~/features/market-data/tracked-instruments";
import { m } from "~/paraglide/messages.js";

/** How a sentence names an instrument whose code a failure or a table gives: a stock by its code, and the index as the texts that take it as the index name it, such as "the IHSG" in English. */
export function instrumentName(code: string): string {
  return code === marketIndex.code
    ? m.measures_index_name({ index: marketIndex.code })
    : code;
}
