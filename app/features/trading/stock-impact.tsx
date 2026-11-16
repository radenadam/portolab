import type { PortfolioKind } from "./portfolio-store.server";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import {
  formatList,
  formatPercent,
  formatNumber,
  formatRupiah,
} from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { pathWithQuery } from "~/path-with-query";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { AnalysisAxis } from "~/features/measures/analysis-axes";
import { isOrderLots, smallestOrderLots } from "~/units/lots";
import { shares } from "~/units/shares";
import type { readTicket } from "./read-ticket.server";
import { previewTrade } from "./preview-trade";
import { orderFailureText } from "./order-failure-text";
import { lotCount } from "./count-parts";
import { stockImpactLots } from "./stock-impact-lots";
import { ticketAmounts } from "./ticket-amounts";
import { ticketContextSearch } from "./ticket-context-search";
import { TradeImpact, ImpactHeading } from "./trade-impact";
import styles from "./trade-impact.module.css";
import { countedText } from "~/counted-text";
import { portfolioWeightOf } from "./portfolio-weight-of";
import { defaultImpactShare, impactShares } from "./impact-shares";
import { ImpactChoices } from "./impact-choices";

export function StockImpact({
  code,
  ticket,
  share = defaultImpactShare,
  portfolioKind = "membership",
  axis,
}: {
  code: string;
  ticket: ReturnType<typeof readTicket>;
  share?: PortfolioWeight | undefined;
  portfolioKind?: PortfolioKind;
  axis?: AnalysisAxis | undefined;
}): ReactNode {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  return (
    <section
      id="impact"
      className={styles["panel"]}
      aria-labelledby="stock-impact-title"
      data-layout="card"
    >
      <div className={styles["header"]}>
        <ImpactHeading
          id="stock-impact-title"
          months={ticket.impact.ok ? ticket.impact.value.months : undefined}
        />
        <ImpactChoices
          choices={impactShares}
          selected={share}
          label={m.trading_impact_share_label()}
          name={(choice) => formatPercent(choice, "integer")}
          field="impact"
          anchor="impact"
        />
      </div>
      {!ticket.day.ok ? (
        <p>
          <NumberText>
            {orderFailureText(ticket.day.failure, portfolioKind)}
          </NumberText>
        </p>
      ) : ticket.quote === undefined ? (
        <p>
          <NumberText>{ticket.quoteNotice}</NumberText>
        </p>
      ) : !ticket.impact.ok ? (
        <p>
          <NumberText>{unpricedImpactText(ticket.impact.failure)}</NumberText>
        </p>
      ) : (
        <StockImpactPreview
          portfolioKind={portfolioKind}
          code={code}
          ticket={{
            ...ticket,
            day: ticket.day,
            quote: ticket.quote,
            impact: ticket.impact,
          }}
          share={share}
          axis={axis}
          path={`${location.pathname.replace(/\/(buy|sell)$/, "")}/buy${ticketContextSearch(query)}`}
        />
      )}
    </section>
  );
}

function StockImpactPreview({
  code,
  ticket,
  share,
  portfolioKind,
  path,
  axis,
}: {
  code: string;
  ticket: ReturnType<typeof readTicket> & {
    day: { ok: true };
    quote: NonNullable<ReturnType<typeof readTicket>["quote"]>;
    impact: { ok: true };
  };
  share: Parameters<typeof stockImpactLots>[0]["share"];
  portfolioKind: PortfolioKind;
  path: string;
  axis: AnalysisAxis | undefined;
}): ReactNode {
  const { quote, day, available } = ticket;
  const { total } = ticket.impact.value;
  const count = stockImpactLots({
    total,
    share,
    price: quote.price,
    day: day.value,
    available,
  });
  const hasOrder = isOrderLots(count);
  const orderCount = hasOrder ? count : smallestOrderLots;
  const preview = previewTrade(
    ticket.impact.value,
    {
      code,
      side: "buy",
      price: { kind: "market" },
      lots: orderCount,
      reason: undefined,
      placedAt: ticket.now,
    },
    { day: day.value, quote },
  );
  const amounts = ticketAmounts("buy", {
    price: quote.price,
    shares: shares(orderCount * day.value.rules.lotShares),
    rates: day.value.rates,
    available,
  });
  if (!hasOrder) {
    if (available < amounts.total) {
      return (
        <TradeImpact
          portfolioKind={portfolioKind}
          axis={axis}
          code={code}
          preview={preview}
        />
      );
    }
    return (
      <p className={styles["notice"]}>
        <NumberText>
          {m.trading_impact_small_budget_notice({
            share: formatPercent(share, "integer"),
            lots: lotCount(smallestOrderLots),
            code,
            cost: formatRupiah(amounts.total),
          })}
        </NumberText>
      </p>
    );
  }
  const inputs = {
    lots: lotCount(count),
    code,
    total: formatRupiah(amounts.total),
    share: formatPercent(portfolioWeightOf(amounts.total, total), "one"),
  };
  return (
    <>
      <p className={styles["notice"]}>
        <NumberText>
          {available < total * share
            ? m.trading_impact_limited_notice(inputs)
            : m.trading_impact_purchase_notice(inputs)}
        </NumberText>
      </p>
      <TradeImpact
        code={code}
        preview={preview}
        axis={axis}
        portfolioKind={portfolioKind}
      />
      {preview.ok && (
        <Link
          className={styles["open"]}
          preventScrollReset
          to={pathWithQuery(path, { lots: formatNumber(count) })}
        >
          <NumberText>
            {m.trading_impact_open_link({ lots: lotCount(count) })}
          </NumberText>
        </Link>
      )}
    </>
  );
}

export function unpricedImpactText(codes: readonly string[]): string {
  return countedText(
    codes.length,
    {
      one: m.trading_impact_one_unpriced_stock_notice,
      several: m.trading_impact_several_unpriced_stocks_notice,
    },
    { codes: formatList(codes, "conjunction") },
  );
}
