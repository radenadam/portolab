import type { Database } from "~/database/database.server";
import { readStockRows } from "~/features/measures/read-measures.server";
import { measureStoredPortfolio } from "~/features/measures/measure-stored.server";
import { summarizePortfolio } from "~/features/measures/measure-summaries";
import { rupiah } from "~/units/rupiah";

export function readLessonExample(database: Database) {
  const stocks = readStockRows(database);
  // The exercise uses stored market data even before a student owns stocks. Equal example values set weights without inventing a quoted price.
  const exampleHoldings = stocks
    .filter((stock) => stock.measures.ok)
    .slice(0, 4)
    .map(({ code }) => ({ code, value: rupiah(1) }));
  const exampleCash = rupiah(1);
  const example =
    exampleHoldings.length > 0
      ? measureStoredPortfolio(database, {
          holdings: exampleHoldings,
          cash: exampleCash,
        })
      : undefined;
  return example?.ok === true
    ? summarizePortfolio(example.value, {
        holdings: exampleHoldings,
        cash: exampleCash,
        total: rupiah(exampleHoldings.length + exampleCash),
      })
    : undefined;
}
