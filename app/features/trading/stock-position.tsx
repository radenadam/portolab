import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import {
  formatMarketTime,
  formatNumber,
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import styles from "~/stat-grid.module.css";
import { lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Shares } from "~/units/shares";
import { shareCount } from "./count-parts";
import { roundedShare } from "./rounded-share";
import type { ValuedHolding } from "./value-portfolio";

export function StockPosition({
  holding,
  lotShares,
}: {
  holding: ValuedHolding;
  lotShares: Shares | undefined;
}): ReactNode {
  const average = rupiah(
    roundedShare(
      holding.cost,
      { numerator: 1, denominator: holding.shares },
      "halfUp",
    ),
  );
  return (
    <dl className={styles["grid"]}>
      <div className={styles["stat"]}>
        <dt>
          {lotShares === undefined
            ? m.trading_shares_label()
            : m.trading_lots_label()}
        </dt>
        <dd>
          {formatNumber(
            lotShares === undefined
              ? holding.shares
              : lots(holding.shares / lotShares),
          )}
        </dd>
        <dd className={styles["note"]}>{shareCount(holding.shares)}</dd>
      </div>
      <div className={styles["stat"]}>
        <dt>
          {m.trading_average_cost_label()}
          <ConceptCard
            title={m.trading_average_cost_label()}
            meaning={m.trading_average_cost_body()}
            example={<p>{formatRupiah(average)}</p>}
            calculation={
              <p>
                {m.trading_average_cost_calculation_notice({
                  cost: formatRupiah(holding.cost),
                  shares: shareCount(holding.shares),
                  average: formatRupiah(average),
                })}
              </p>
            }
            lesson={<ConceptLesson termId="harga-rata-rata" />}
          />
        </dt>
        <dd>{formatRupiah(average)}</dd>
      </div>
      {holding.kind === "priced" ? (
        <>
          <div className={styles["stat"]}>
            <dt>{m.trading_value_label()}</dt>
            <dd>{formatRupiah(holding.value)}</dd>
            <dd className={styles["note"]}>
              {formatMarketTime(holding.quote.quotedAt)}
            </dd>
          </div>
          <div className={styles["stat"]}>
            <dt>
              {m.trading_gain_label()}
              <ConceptCard
                title={m.trading_gain_label()}
                meaning={m.trading_position_gain_body()}
                example={
                  <p>
                    <ChangeText
                      colored
                      change={formatSignedRupiah(holding.gain)}
                    />
                  </p>
                }
                calculation={
                  <p>
                    {m.trading_position_gain_calculation_notice({
                      value: formatRupiah(holding.value),
                      cost: formatRupiah(holding.cost),
                      gain: formatSignedRupiah(holding.gain).text,
                    })}
                  </p>
                }
                lesson={<ConceptLesson termId="laba-rugi" />}
              />
            </dt>
            <dd>
              <ChangeText colored change={formatSignedRupiah(holding.gain)} />
            </dd>
            <dd className={styles["note"]}>
              <ChangeText
                colored
                change={formatSignedPercent(holding.gainReturn)}
              />
            </dd>
          </div>
        </>
      ) : (
        <div className={styles["stat"]}>
          <dt>{m.trading_value_label()}</dt>
          <dd className={styles["note"]}>
            {m.trading_unpriced_notice({ code: holding.code })}
          </dd>
        </div>
      )}
    </dl>
  );
}
