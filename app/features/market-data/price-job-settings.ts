import type { Database } from "~/database/database.server";
import type { Instrument, PriceSource } from "./price-source.server";

/** What the price job works with, which the server chooses at startup. */
export interface PriceJobSettings {
  database: Database;
  priceSource: PriceSource;
  instruments: readonly Instrument[];
  /** The date in WIB from which the job fetches the daily closes of every instrument, such as 2021-09-01. */
  historyStartDate: string;
}
