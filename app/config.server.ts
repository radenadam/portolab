import { fail, succeed } from "~/result";
import type { Result } from "~/result";

const priceSourceNames = ["yahoo", "fixture"] as const;

type PriceSourceName = (typeof priceSourceNames)[number];

export interface Config {
  databasePath: string;
  priceSource: PriceSourceName;
}

/** Reads the configuration from environment variables. README.md lists each variable and its default. */
export function readConfig(
  environment: Readonly<Record<string, string | undefined>>,
): Result<Config, string> {
  const priceSource = parsePriceSource(
    environment["PRICE_SOURCE"] ?? "yahoo",
    "PRICE_SOURCE",
  );
  if (!priceSource.ok) {
    return priceSource;
  }
  return succeed({
    databasePath: environment["DATABASE_PATH"] ?? "data/portolab.sqlite",
    priceSource: priceSource.value,
  });
}

function parsePriceSource(
  value: unknown,
  source: string,
): Result<PriceSourceName, string> {
  const name = priceSourceNames.find((candidate) => candidate === value);
  return name === undefined
    ? fail(
        `${source} must be "yahoo" or "fixture", but it is "${String(value)}".`,
      )
    : succeed(name);
}
