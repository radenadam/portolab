import type { SessionNumber } from "~/features/classes/course-calendar";
import { companyOf } from "~/features/market-data/company-of";
import type { Sector } from "~/features/market-data/company-of";
import { sectorName } from "~/features/market-data/sector-name";
import { formatBeta, formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Beta } from "~/units/beta";
import type { VarianceShare } from "~/units/variance-share";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { HomePortfolioData } from "./read-home-portfolio.server";

const materialCashWeight = portfolioWeight(0.05);
const materialHoldingWeight = portfolioWeight(0.05);
const concentratedSectorWeight = portfolioWeight(0.35);
const largeRiskRatio = 1.5;

interface InsightHolding {
  code: string;
  beta: Beta;
  weight: PortfolioWeight;
  result: CumulativeReturn;
  varianceShare: VarianceShare | undefined;
}

interface MeasuredInsight {
  kind: "measured";
  beta: Beta;
  cashWeight: PortfolioWeight;
  holdings: readonly InsightHolding[];
}
export type HomeInsightData =
  { kind: "empty" } | { kind: "unmeasured" } | MeasuredInsight;

/** The observation needs only the measures it names, so it cannot depend on unrelated report fields. */
export function homeInsightData(
  home: Pick<HomePortfolioData, "measures" | "report">,
): HomeInsightData {
  if (home.report.valuation.holdings.length === 0) return { kind: "empty" };
  if (home.measures.kind !== "measured" || !home.measures.measures.ok)
    return { kind: "unmeasured" };
  const portfolio = home.measures.measures.value;
  const holdings = portfolio.holdings.map((holding) => {
    const valued = home.report.valuation.holdings.find(
      ({ code }) => code === holding.code,
    );
    if (valued?.kind !== "priced")
      throw new Error(
        `The measured holding ${holding.code} has no delayed valuation.`,
      );
    return {
      code: holding.code,
      beta: holding.beta,
      weight: holding.weight,
      result: valued.gainReturn,
      varianceShare: portfolio.holdingRisks.ok
        ? portfolio.holdingRisks.value.find(({ code }) => code === holding.code)
            ?.varianceShare
        : undefined,
    };
  });
  return {
    kind: "measured",
    beta: portfolio.beta,
    cashWeight: portfolio.cash.weight,
    holdings,
  };
}

/** One observation uses the student's holdings, without suggesting a security or treating beta as a forecast. */
export function homeInsight(
  portfolio: HomeInsightData,
  studentName?: string,
): {
  session: SessionNumber;
  topic: string;
  text: string;
} {
  if (portfolio.kind === "empty")
    return {
      session: 6,
      topic: m.trading_home_orders_label(),
      text:
        studentName === undefined
          ? m.trading_home_insight_empty_body()
          : m.trading_home_student_insight_empty_body({ name: studentName }),
    };
  if (portfolio.kind === "unmeasured")
    return betaInsight(m.trading_home_insight_unmeasured_body());
  const positions = portfolio.holdings;
  const holdingText = holdingInsight(positions, portfolio, studentName);
  if (holdingText !== undefined) return betaInsight(holdingText);
  const riskText = riskInsight(positions, studentName);
  if (riskText !== undefined)
    return {
      session: 10,
      topic: m.trading_home_risk_topic_label(),
      text: riskText,
    };
  const sectorText = sectorInsight(positions, studentName);
  if (sectorText !== undefined)
    return {
      session: 2,
      topic: m.trading_home_diversification_label(),
      text: sectorText,
    };
  const inputs = { beta: formatBeta(portfolio.beta) };
  return betaInsight(
    studentName === undefined
      ? m.trading_home_insight_beta_body(inputs)
      : m.trading_home_student_insight_beta_body({
          ...inputs,
          name: studentName,
        }),
  );
}

function betaInsight(text: string) {
  return { session: 9 as const, topic: m.trading_home_beta_label(), text };
}
function holdingInsight(
  positions: readonly InsightHolding[],
  portfolio: MeasuredInsight,
  studentName?: string,
): string | undefined {
  const single = positions.length === 1 ? positions[0] : undefined;
  const highest = positions.toSorted(
    (first, second) => second.beta - first.beta,
  )[0];
  const lowest = positions.toSorted(
    (first, second) => first.beta - second.beta,
  )[0];
  const top = positions.toSorted(
    (first, second) => second.result - first.result,
  )[0];
  const cash = cashClause(portfolio);
  if (single !== undefined) {
    const inputs = { code: single.code, beta: formatBeta(single.beta), cash };
    return studentName === undefined
      ? m.trading_home_insight_one_holding_body(inputs)
      : m.trading_home_student_insight_one_holding_body({
          ...inputs,
          name: studentName,
        });
  }
  if (top !== undefined && top.result > 0 && top.code === highest?.code)
    return m.trading_home_insight_high_body({
      code: top.code,
      beta: formatBeta(top.beta),
      cash,
    });
  if (top !== undefined && top.result > 0 && top.code === lowest?.code)
    return m.trading_home_insight_low_body({
      code: top.code,
      beta: formatBeta(top.beta),
    });
  return undefined;
}
function riskInsight(
  positions: readonly InsightHolding[],
  studentName?: string,
): string | undefined {
  const risks = positions.flatMap((holding) =>
    holding.varianceShare !== undefined &&
    holding.weight >= materialHoldingWeight &&
    holding.varianceShare / holding.weight > largeRiskRatio
      ? [{ ...holding, share: holding.varianceShare }]
      : [],
  );
  const risk = risks.toSorted(
    (first, second) =>
      second.share / second.weight - first.share / first.weight,
  )[0];
  if (risk === undefined) return undefined;
  const inputs = {
    code: risk.code,
    weight: formatPercent(risk.weight, "integer"),
    share: formatPercent(risk.share, "integer"),
  };
  return studentName === undefined
    ? m.trading_home_insight_risk_body(inputs)
    : m.trading_home_student_insight_risk_body({
        ...inputs,
        name: studentName,
      });
}
function sectorInsight(
  positions: readonly InsightHolding[],
  studentName?: string,
): string | undefined {
  const sectors = new Map<Sector, PortfolioWeight>();
  for (const holding of positions) {
    const sector = companyOf(holding.code).sector;
    sectors.set(
      sector,
      portfolioWeight((sectors.get(sector) ?? 0) + holding.weight),
    );
  }
  const sector = [...sectors].toSorted(
    (first, second) => second[1] - first[1],
  )[0];
  if (sector !== undefined && sector[1] >= concentratedSectorWeight) {
    const inputs = {
      weight: formatPercent(sector[1], "integer"),
      sector: sectorName(sector[0]),
    };
    return studentName === undefined
      ? m.trading_home_insight_sector_body(inputs)
      : m.trading_home_student_insight_sector_body({
          ...inputs,
          name: studentName,
        });
  }
  return undefined;
}

function cashClause(portfolio: MeasuredInsight): string {
  return portfolio.cashWeight >= materialCashWeight && portfolio.beta > 0
    ? m.trading_home_insight_cash_part({
        weight: formatPercent(portfolio.cashWeight, "integer"),
        beta: formatBeta(portfolio.beta),
      })
    : "";
}
