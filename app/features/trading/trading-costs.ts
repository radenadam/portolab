import { periodCovering } from "~/period-covering";
import type { DatePeriod } from "~/period-covering";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { listOfWords } from "~/sentences";
import { basisPoints, basisPointsPerWhole } from "~/units/basis-points";
import type { BasisPoints } from "~/units/basis-points";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { OrderSide } from "./order";
import { roundedShare } from "./rounded-share";

interface FeeSchedule extends DatePeriod {
  buyFee: BasisPoints;
  sellFee: BasisPoints;
  /** The broker whose fees these are, and where they were read. */
  source: string;
}

interface SalesTaxRule extends DatePeriod {
  rate: BasisPoints;
  /** The regulation that sets the rate. */
  source: string;
}

// Decision 0016 explains why Portolab charges the fees of one typical broker. A broker's fee includes the levy of IDX, KPEI, and KSEI and the value added tax on its commission.
const feeSchedules: readonly FeeSchedule[] = [
  {
    from: "2026-11-01",
    buyFee: basisPoints(15),
    sellFee: basisPoints(15),
    source:
      "the help center of Stockbit Sekuritas on 1 November 2026, which lists 0.15% for a purchase and 0.25% for a sale, and the home page of Stockbit, which says that the fee of a sale includes the final tax on sales",
  },
];

const salesTaxRules: readonly SalesTaxRule[] = [
  {
    from: "1997-05-29",
    rate: basisPoints(10),
    source:
      "article 1 paragraph 2a of Peraturan Pemerintah 41/1994, as Peraturan Pemerintah 14/1997 of 29 May 1997 amended it, which article 244 of PMK 81/2024 restates",
  },
];

/** The rates of the costs of the trades of one day. */
export interface CostRates {
  buyFee: BasisPoints;
  sellFee: BasisPoints;
  salesTax: BasisPoints;
}

/** The rates of the costs of the trades of a day. It fails for a date that the fees or the tax have no record for, and names each of them. */
export function costRatesOn(date: string): Result<CostRates, string> {
  const fees = periodCovering(feeSchedules, date);
  const tax = periodCovering(salesTaxRules, date);
  const missing: string[] = [];
  if (fees === undefined) {
    missing.push("the broker fee");
  }
  if (tax === undefined) {
    missing.push("the final tax on sales");
  }
  if (fees === undefined || tax === undefined) {
    return fail(
      `No record of ${listOfWords(missing)} covers ${date}, so add the rates for that day to trading-costs.ts.`,
    );
  }
  return succeed({
    buyFee: fees.buyFee,
    sellFee: fees.sellFee,
    salesTax: tax.rate,
  });
}

/** What a trade costs on top of its value. */
interface TradeCosts {
  fee: Rupiah;
  tax: Rupiah;
}

/** The broker fee and the final tax on sales of a trade of a value. Each is its rate of the value, rounded to the nearest whole rupiah with halves up, as ROUND does in a spreadsheet, and a purchase pays no tax. */
export function tradeCosts(
  side: OrderSide,
  value: Rupiah,
  rates: CostRates,
): TradeCosts {
  switch (side) {
    case "buy":
      return { fee: amountAtRate(value, rates.buyFee), tax: rupiah(0) };
    case "sell":
      return {
        fee: amountAtRate(value, rates.sellFee),
        tax: amountAtRate(value, rates.salesTax),
      };
  }
}

/** What a purchase pays out: its value and its broker fee. */
export function purchaseCost(trade: { value: Rupiah; fee: Rupiah }): Rupiah {
  return rupiah(trade.value + trade.fee);
}

/** The change of the cash of an account from a trade: a purchase pays out its cost, and a sale pays in its value less its broker fee and the final tax on sales. */
export function cashChange(
  side: OrderSide,
  trade: TradeCosts & { value: Rupiah },
): Rupiah {
  switch (side) {
    case "buy":
      return rupiah(0 - purchaseCost(trade));
    case "sell":
      return rupiah(trade.value - trade.fee - trade.tax);
  }
}

function amountAtRate(value: Rupiah, rate: BasisPoints): Rupiah {
  return rupiah(
    roundedShare(
      value,
      { numerator: rate, denominator: basisPointsPerWhole },
      "halfUp",
    ),
  );
}
