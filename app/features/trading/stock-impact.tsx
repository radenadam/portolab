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
import { smallestOrderLots } from "~/units/lots";
import { shares } from "~/units/shares";
import type { readTicket } from "./read-ticket.server";
import { parseOrderLots } from "./parse-order-lots";
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
  axis,
}: {
  code: string;
  ticket: ReturnType<typeof readTicket>;
  share?: PortfolioWeight | undefined;
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
          <NumberText>{orderFailureText(ticket.day.failure)}</NumberText>
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
  const parsed = parseOrderLots(
    formatNumber(count),
    m.trading_lots_label(),
    day.value.rules.maximumLots,
  );
  const amounts = ticketAmounts("buy", {
    price: quote.price,
    shares: shares(count * day.value.rules.lotShares),
    rates: day.value.rates,
    available,
  });
  if (!parsed.ok) {
    const smallest = ticketAmounts("buy", {
      price: quote.price,
      shares: shares(smallestOrderLots * day.value.rules.lotShares),
      rates: day.value.rates,
      available,
    });
    if (available < smallest.total) {
      const minimum = parseOrderLots(
        formatNumber(smallestOrderLots),
        m.trading_lots_label(),
        day.value.rules.maximumLots,
      );
      if (!minimum.ok) throw new Error(minimum.failure);
      return (
        <TradeImpact
          axis={axis}
          code={code}
          preview={previewTrade(
            ticket.impact.value,
            {
              code,
              side: "buy",
              price: { kind: "market" },
              lots: minimum.value,
              reason: undefined,
              placedAt: ticket.now,
            },
            { day: day.value, quote },
          )}
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
            cost: formatRupiah(smallest.total),
          })}
        </NumberText>
      </p>
    );
  }
  const preview = previewTrade(
    ticket.impact.value,
    {
      code,
      side: "buy",
      price: { kind: "market" },
      lots: parsed.value,
      reason: undefined,
      placedAt: ticket.now,
    },
    { day: day.value, quote },
  );
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
      <TradeImpact code={code} preview={preview} axis={axis} />
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
