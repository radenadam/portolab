import { fail, succeed } from "~/result";
import type { Result } from "~/result";

const priceSourceNames = ["yahoo", "fixture"] as const;

type PriceSourceName = (typeof priceSourceNames)[number];

export interface Config {
  databasePath: string;
  priceSource: PriceSourceName;
}

/** Reads the configuration from environment variables. README.md lists each variable. */
export function readConfig(
  environment: Record<string, string | undefined>,
): Result<Config, string> {
  const priceSource = environment["PRICE_SOURCE"] ?? "yahoo";
  if (!isPriceSourceName(priceSource)) {
    return fail(
      `PRICE_SOURCE must be one of ${priceSourceNames.join(", ")}, but it is "${priceSource}".`,
    );
  }
  return succeed({
    databasePath: environment["DATABASE_PATH"] ?? "data/portolab.sqlite",
    priceSource,
  });
}

function isPriceSourceName(value: string): value is PriceSourceName {
  return priceSourceNames.some((name) => name === value);
}
