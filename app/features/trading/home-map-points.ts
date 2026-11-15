import { portfolioLabel } from "./portfolio-label";
import { portfolioStudentName } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import type { MarkedPoint, MapPoint } from "~/charts/layout-risk-map";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatBeta, formatPercent, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { beta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { homeHoldings } from "./home-holdings";
import type { HomePortfolioData } from "./read-home-portfolio.server";

/** The map compares current delayed values. The small chart keeps final daily closes. */
export function homeMapPoints(
  home: HomePortfolioData,
  reader: PortfolioReader,
):
  | {
      market: MapPoint<Beta, CumulativeReturn>;
      points: MarkedPoint<Beta, CumulativeReturn>[];
    }
  | undefined {
  const market = home.report.market;
  if (market === undefined) return undefined;
  const points: MarkedPoint<Beta, CumulativeReturn>[] = home.classmates.map(
    (classmate, index) => ({
      ...mapPoint(
        {
          key: `classmate-${String(index)}`,
          name: m.trading_home_classmate_label(),
        },
        classmate.beta,
        classmate.return,
      ),
      mark: { kind: "classmate" },
    }),
  );
  const measured =
    home.measures.kind === "measured" && home.measures.measures.ok
      ? home.measures.measures.value
      : undefined;
  points.push(...heldPoints(home));
  if (measured !== undefined && home.report.valuation.total !== undefined) {
    points.push({
      ...mapPoint(
        {
          key: "portfolio",
          name: portfolioLabel(portfolioStudentName(reader)),
        },
        measured.beta,
        home.report.valuation.total.return,
      ),
      mark: { kind: "own" },
    });
  }
  return {
    market: mapPoint(
      { key: "IHSG", name: marketIndex.code },
      beta(1),
      market.return,
    ),
    points,
  };
}

function mapPoint(
  { key, name }: { key: string; name: string },
  risk: Beta,
  result: CumulativeReturn,
): MapPoint<Beta, CumulativeReturn> {
  return {
    key,
    name,
    across: risk,
    up: result,
    labelValue: formatSignedPercent(result).text,
    values: [
      { name: m.trading_home_beta_label(), value: formatBeta(risk) },
      {
        name: m.trading_home_map_return_label(),
        value: formatSignedPercent(result),
      },
    ],
  };
}

function heldPoints(
  home: HomePortfolioData,
): MarkedPoint<Beta, CumulativeReturn>[] {
  const points: MarkedPoint<Beta, CumulativeReturn>[] = [];
  const measured =
    home.measures.kind === "measured" && home.measures.measures.ok
      ? home.measures.measures.value
      : undefined;
  for (const { holding, weight } of homeHoldings(home.report.valuation)
    .holdings) {
    const risk =
      measured?.holdings.find(({ code }) => code === holding.code)?.beta ??
      home.stockBetas.find(({ code }) => code === holding.code)?.beta;
    if (holding.kind !== "priced" || risk === undefined) continue;
    const stock = mapPoint(
      { key: holding.code, name: holding.code },
      risk,
      holding.gainReturn,
    );
    points.push({
      ...stock,
      values: [
        ...stock.values,
        {
          name: m.trading_home_weight_label(),
          value:
            weight === undefined
              ? m.trading_home_weight_unavailable_notice()
              : formatPercent(weight, "one"),
        },
      ],
      mark: { kind: "held", weight },
    });
  }
  return points;
}
