import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import {
  formatPercent,
  formatNumber,
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import styles from "~/stat-grid.module.css";
import { portfolioWeightOf } from "./portfolio-weight-of";
import { lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { Shares } from "~/units/shares";
import { shareCount } from "./count-parts";
import { roundedShare } from "./rounded-share";
import type { ValuedHolding } from "./value-portfolio";

export function StockPosition({
  holding,
  lotShares,
  totalValue,
}: {
  holding: ValuedHolding;
  lotShares: Shares | undefined;
  totalValue: Rupiah | undefined;
}): ReactNode {
  const average = rupiah(
    roundedShare(
      holding.cost,
      { numerator: 1, denominator: holding.shares },
      "halfUp",
    ),
  );
  return (
    <dl className={[styles["grid"], styles["position"]].join(" ")}>
      <div className={styles["stat"]}>
        <dt>
          <NumberText>
            {lotShares === undefined
              ? m.trading_shares_label()
              : m.trading_position_lots_label()}
          </NumberText>
        </dt>
        <dd>
          <NumberText>
            {formatNumber(
              lotShares === undefined
                ? holding.shares
                : lots(holding.shares / lotShares),
            )}
          </NumberText>
        </dd>
        <dd className={styles["note"]}>
          <NumberText>{shareCount(holding.shares)}</NumberText>
        </dd>
      </div>
      <div className={styles["stat"]}>
        <dt>
          {m.trading_average_cost_label()}
          <ConceptCard
            title={m.trading_average_cost_label()}
            meaning={m.trading_average_cost_body()}
            example={
              <p>
                <NumberText>{formatRupiah(average)}</NumberText>
              </p>
            }
            calculation={
              <p>
                <NumberText>
                  {m.trading_average_cost_calculation_notice({
                    cost: formatRupiah(holding.cost),
                    shares: shareCount(holding.shares),
                    average: formatRupiah(average),
                  })}
                </NumberText>
              </p>
            }
            lesson={<ConceptLesson termId="harga-rata-rata" />}
          />
        </dt>
        <dd>
          <NumberText>{formatRupiah(average)}</NumberText>
        </dd>
      </div>
      {holding.kind === "priced" ? (
        <>
          <div className={styles["stat"]}>
            <dt>{m.trading_value_label()}</dt>
            <dd>
              <NumberText>{formatRupiah(holding.value)}</NumberText>
            </dd>
            {totalValue !== undefined && (
              <dd className={styles["note"]}>
                <NumberText>
                  {m.trading_position_weight_notice({
                    weight: formatPercent(
                      portfolioWeightOf(holding.value, totalValue),
                    ),
                  })}
                </NumberText>
              </dd>
            )}
          </div>
          <div className={styles["stat"]}>
            <dt>
              {m.trading_position_gain_label()}
              <ConceptCard
                title={m.trading_position_gain_label()}
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
                    <NumberText>
                      {m.trading_position_gain_calculation_notice({
                        value: formatRupiah(holding.value),
                        cost: formatRupiah(holding.cost),
                        gain: formatSignedRupiah(holding.gain).text,
                      })}
                    </NumberText>
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
            <NumberText>
              {m.trading_unpriced_notice({ code: holding.code })}
            </NumberText>
          </dd>
        </div>
      )}
    </dl>
  );
}
