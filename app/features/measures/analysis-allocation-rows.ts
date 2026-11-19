import { companyOf } from "~/features/market-data/company-of";
import type { Sector } from "~/features/market-data/company-of";
import type { AllocationGroup } from "./allocation-groups";
import { sectorName } from "~/features/market-data/sector-name";
import { portfolioWeightOf } from "~/features/trading/portfolio-weight-of";
import { sectorWeight } from "~/features/trading/sector-weight";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import { m } from "~/paraglide/messages.js";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { PortfolioWeight } from "~/units/portfolio-weight";

interface AllocationRow {
  key: string;
  name: string;
  value: Rupiah;
  weight: PortfolioWeight;
  /** The codes of the holdings whose prices set the weight, whose times stand beside it. */
  codes: readonly string[];
}

type Allocation =
  | { kind: "unpriced"; codes: string[] }
  | { kind: "zeroValue" }
  | { kind: "valued"; rows: AllocationRow[]; total: Rupiah };

/** Allocation uses current values even when the holdings lack shared monthly returns. */
export function analysisAllocationRows(
  valuation: PortfolioValuation,
  group: AllocationGroup,
): Allocation {
  if (valuation.total === undefined)
    return { kind: "unpriced", codes: valuation.unpricedCodes };
  const total = valuation.total.value;
  if (total === 0) return { kind: "zeroValue" };
  const holdings = valuation.holdings.flatMap((holding) =>
    holding.kind === "priced"
      ? [
          {
            code: holding.code,
            value: holding.value,
            weight: portfolioWeightOf(holding.value, total),
          },
        ]
      : [],
  );
  const rows: AllocationRow[] = [];
  switch (group) {
    case "stock":
      for (const holding of holdings)
        rows.push({
          key: holding.code,
          name: holding.code,
          value: holding.value,
          weight: holding.weight,
          codes: [holding.code],
        });
      break;
    case "sector": {
      const values = new Map<Sector, AllocationRow>();
      for (const holding of holdings) {
        const sector = companyOf(holding.code).sector;
        const existing = values.get(sector);
        values.set(sector, {
          key: sector,
          name: sectorName(sector),
          value: rupiah((existing?.value ?? 0) + holding.value),
          weight: sectorWeight(holdings, holding.code),
          codes: [...(existing?.codes ?? []), holding.code],
        });
      }
      rows.push(...values.values());
      break;
    }
  }
  return {
    kind: "valued",
    total,
    rows: [
      ...rows.toSorted((first, second) => second.value - first.value),
      {
        key: "cash",
        name: m.measures_cash_label(),
        value: valuation.cash,
        weight: portfolioWeightOf(valuation.cash, total),
        codes: [],
      },
    ],
  };
}
