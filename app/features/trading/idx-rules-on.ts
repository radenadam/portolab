import { periodCovering } from "~/period-covering";
import type { DatePeriod } from "~/period-covering";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { listOfWords } from "~/sentences";
import { lots } from "~/units/lots";
import type { Lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Shares } from "~/units/shares";
import { oneRupiahLimit, rateLimit } from "./price-limits";
import type { PriceLimit } from "./price-limits";

/** A rule of IDX with the dates on which it applies and the decision of IDX that set it. */
interface IdxRule extends DatePeriod {
  /** The decision of IDX, and the report that this record was read from, because the site of IDX refuses automated readers. */
  source: string;
}

interface OrderSizeRule extends IdxRule {
  /** The shares in one lot. */
  lotShares: Shares;
  /** The most lots that one order may have. */
  maximumLots: Lots;
}

/** The step in which every price from `from` moves, up to the start of the next band. */
export interface TickBand {
  from: Rupiah;
  tick: Rupiah;
}

interface TickRule extends IdxRule {
  /** The bands from the lowest price up. */
  bands: readonly TickBand[];
}

interface MinimumPriceRule extends IdxRule {
  price: Rupiah;
}

/** The limits above and below the reference price for every reference price up to `upTo`, which the highest band has none of. */
export interface AutoRejectionBand {
  upTo: Rupiah | undefined;
  upper: PriceLimit;
  lower: PriceLimit;
}

interface AutoRejectionRule extends IdxRule {
  /** The bands from the lowest reference price up. */
  bands: readonly AutoRejectionBand[];
}

/** The rules of IDX for the orders of one trading day. */
export interface IdxRules {
  lotShares: Shares;
  maximumLots: Lots;
  tickBands: readonly TickBand[];
  minimumPrice: Rupiah;
  autoRejectionBands: readonly AutoRejectionBand[];
}

// The rule limits an order to 5% of the listed shares of the stock as well, but every stock of the LQ45 has more than 100 million listed shares, so 50,000 lots of 100 shares is always the smaller limit.
const orderSizeRules: readonly OrderSizeRule[] = [
  {
    from: "2014-01-06",
    lotShares: shares(100),
    maximumLots: lots(50_000),
    source:
      "Kep-00071/BEI/11-2013 of 8 November 2013, as detikFinance and Okezone reported it",
  },
];

// The tick table of IDX also lists a largest price step for each band, which no report explains, so Portolab leaves it out until issue #32 settles what it limits.
const tickRules: readonly TickRule[] = [
  {
    from: "2016-05-02",
    bands: [
      { from: rupiah(1), tick: rupiah(1) },
      { from: rupiah(200), tick: rupiah(2) },
      { from: rupiah(500), tick: rupiah(5) },
      { from: rupiah(2_000), tick: rupiah(10) },
      { from: rupiah(5_000), tick: rupiah(25) },
    ],
    source:
      "Kep-00023/BEI/04-2016, as Okezone reported it on 2 May 2016, which the rules of 28 September 2026 kept, as Maybank Sekuritas listed them",
  },
];

const minimumPriceRules: readonly MinimumPriceRule[] = [
  {
    from: "2026-09-28",
    price: rupiah(1),
    source:
      "Kep-00136/BEI/09-2026 of 21 September 2026, as Bareksa and Bisnis.com reported it",
  },
];

const upToRp10: AutoRejectionBand = {
  upTo: rupiah(10),
  upper: oneRupiahLimit,
  lower: oneRupiahLimit,
};

// Kep-00157/BEI/10-2026 set these limits, and Kep-00158/BEI/10-2026 kept them.
const bandsWithLowerLimitOf7Percent: readonly AutoRejectionBand[] = [
  { upTo: rupiah(200), upper: rateLimit(3_500), lower: rateLimit(700) },
  { upTo: rupiah(5_000), upper: rateLimit(2_500), lower: rateLimit(700) },
  { upTo: undefined, upper: rateLimit(2_000), lower: rateLimit(700) },
];

// These are the limits of the main, development, and new economy boards, which decision 0016 applies to every stock. Kep-00136/BEI/09-2026 planned limits as wide below the reference price as above it from 1 January 2027, but the decisions of October 2026 that replaced it end on 31 December 2026 and say nothing about 2027, so no limits are recorded after that day until IDX announces them, as issue #30 tracks.
const autoRejectionRules: readonly AutoRejectionRule[] = [
  {
    from: "2026-09-28",
    until: "2026-10-18",
    bands: [
      upToRp10,
      { upTo: rupiah(200), upper: rateLimit(3_500), lower: rateLimit(1_500) },
      { upTo: rupiah(5_000), upper: rateLimit(2_500), lower: rateLimit(1_500) },
      { upTo: undefined, upper: rateLimit(2_000), lower: rateLimit(1_500) },
    ],
    source:
      "Kep-00136/BEI/09-2026 of 21 September 2026, as Bareksa reported it on 22 September 2026",
  },
  {
    from: "2026-10-19",
    until: "2026-10-19",
    bands: [upToRp10, ...bandsWithLowerLimitOf7Percent],
    source:
      "Kep-00157/BEI/10-2026, as Kontan and CNBC Indonesia reported it on 19 October 2026",
  },
  {
    from: "2026-10-20",
    until: "2026-12-31",
    bands: [
      upToRp10,
      { upTo: rupiah(14), upper: rateLimit(3_500), lower: oneRupiahLimit },
      ...bandsWithLowerLimitOf7Percent,
    ],
    source:
      "Kep-00158/BEI/10-2026, as CNBC Indonesia and Bareksa reported it on 20 October 2026",
  },
];

/** The rules of IDX for the orders of a trading day. It fails for a date that some rule has no record for, and names every such rule. */
export function idxRulesOn(date: string): Result<IdxRules, string> {
  const orderSize = periodCovering(orderSizeRules, date);
  const ticks = periodCovering(tickRules, date);
  const minimumPrice = periodCovering(minimumPriceRules, date);
  const autoRejection = periodCovering(autoRejectionRules, date);
  const missing: string[] = [];
  if (orderSize === undefined) {
    missing.push("the order sizes");
  }
  if (ticks === undefined) {
    missing.push("the tick sizes");
  }
  if (minimumPrice === undefined) {
    missing.push("the minimum price");
  }
  if (autoRejection === undefined) {
    missing.push("the auto rejection limits");
  }
  if (
    orderSize === undefined ||
    ticks === undefined ||
    minimumPrice === undefined ||
    autoRejection === undefined
  ) {
    return fail(
      `No recorded IDX rule for ${listOfWords(missing)} covers ${date}, so add the rules that IDX set for that day to idx-rules-on.ts.`,
    );
  }
  return succeed({
    lotShares: orderSize.lotShares,
    maximumLots: orderSize.maximumLots,
    tickBands: ticks.bands,
    minimumPrice: minimumPrice.price,
    autoRejectionBands: autoRejection.bands,
  });
}
