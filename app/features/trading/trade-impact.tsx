import { marketIndex } from "~/features/market-data/tracked-instruments";
import { useId } from "react";
import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { measureFailureText } from "~/features/measures/measure-failure-text";
import { monthSpanInputs, monthSpanOf } from "~/features/measures/month-span";
import type { MonthSpan } from "~/features/measures/month-span";
import { formatNumber } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { ImpactRows } from "./impact-rows";
import { ImpactMap } from "./impact-map";
import { ImpactPoints } from "./impact-points";
import { orderFailureText } from "./order-failure-text";
import type { TradePreview } from "./preview-trade";
import type { AnalysisAxis } from "~/features/measures/analysis-axes";
import styles from "./trade-impact.module.css";

export function ImpactHeading({
  id,
  months,
}: {
  id: string;
  months: MonthSpan | undefined;
}): ReactNode {
  return (
    <h2 className={styles["heading"]} aria-labelledby={id}>
      <span id={id}>{m.trading_impact_title()}</span>
      <ConceptHelp title={m.trading_impact_title()}>
        <p>{m.trading_impact_body()}</p>
        {months !== undefined && (
          <p>
            <NumberText>
              {m.trading_impact_months_body({
                ...monthSpanInputs(months),
                index: marketIndex.code,
              })}
            </NumberText>
          </p>
        )}
        <ConceptLesson termId="diversifikasi" />
      </ConceptHelp>
    </h2>
  );
}

export function TradeImpact({
  preview,
  code,
  ticket = false,
  axis,
}: {
  preview: TradePreview;
  code: string;
  ticket?: boolean;
  axis?: AnalysisAxis | undefined;
}): ReactNode {
  const headingId = useId();
  if (!preview.ok) {
    const text = failureText(preview.failure);
    if (text === undefined) return null;
    return (
      <p className={styles["notice"]}>
        <NumberText>{text}</NumberText>
      </p>
    );
  }
  const { impact, originalMonths } = preview.value;
  const shared = monthSpanOf(impact.before.market.returns);
  const changed =
    originalMonths !== undefined &&
    (originalMonths.count !== shared.count ||
      originalMonths.first !== shared.first ||
      originalMonths.last !== shared.last);
  return (
    <>
      {changed && (
        <p className={styles["notice"]}>
          <NumberText>
            {m.trading_impact_months_notice({
              original: formatNumber(originalMonths.count),
              ...monthSpanInputs(shared),
            })}
          </NumberText>
        </p>
      )}
      <div className={ticket ? styles["ticketGrid"] : styles["grid"]}>
        <ImpactRows impact={impact} code={code} ticket={ticket} />
        <div>
          <h3 id={headingId} className={styles["srOnly"]}>
            {m.trading_impact_map_title()}
          </h3>
          <ImpactMap
            impact={impact}
            code={code}
            labelledBy={headingId}
            axis={axis}
          />
          <div className={styles["inputs"]}>
            <ImpactPoints impact={impact} code={code} />
          </div>
        </div>
      </div>
    </>
  );
}

function failureText(
  failure: Extract<TradePreview, { ok: false }>["failure"],
): string | undefined {
  switch (failure.kind) {
    case "order": {
      const reason = failure.failure;
      if (reason.kind === "offTick" || reason.kind === "outsideLimits")
        return undefined;
      return orderFailureText(reason);
    }
    case "measures":
      return measureFailureText(failure.failure, {
        kind: "portfolio",
        reader: { kind: "owner" },
      });
  }
}
