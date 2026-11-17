import type { ReactNode } from "react";
import type { IdxRules } from "~/features/trading/idx-rules-on";
import { formatLimit } from "~/features/trading/limit-price-failure-text";
import { formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import styles from "./trading-lesson.module.css";

export function TickTable({
  rules,
  highlight,
}: {
  rules: IdxRules;
  highlight?: Rupiah | undefined;
}): ReactNode {
  return (
    <table className={styles["table"]}>
      <thead>
        <tr>
          <th>{m.learning_stock_price_label()}</th>
          <th>{m.learning_tick_label()}</th>
        </tr>
      </thead>
      <tbody>
        {rules.tickBands.map((band, index) => {
          const from = rupiah(Math.max(rules.minimumPrice, band.from));
          const next = rules.tickBands[index + 1]?.from;
          return (
            <tr
              key={band.from}
              data-selected={
                highlight !== undefined &&
                highlight >= from &&
                (next === undefined || highlight < next)
              }
            >
              <td>
                <NumberText>
                  {next === undefined
                    ? m.learning_range_above_label({ from: formatRupiah(from) })
                    : m.learning_range_below_label({
                        from: formatRupiah(from),
                        to: formatRupiah(next),
                      })}
                </NumberText>
              </td>
              <td>
                <NumberText whole>{formatRupiah(band.tick)}</NumberText>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function BandTable({ rules }: { rules: IdxRules }): ReactNode {
  return (
    <table className={styles["table"]}>
      <thead>
        <tr>
          <th>{m.learning_reference_price_label()}</th>
          <th>{m.learning_ara_label()}</th>
          <th>{m.learning_arb_label()}</th>
        </tr>
      </thead>
      <tbody>
        {rules.autoRejectionBands.map((band, index) => {
          const previous = rules.autoRejectionBands[index - 1]?.upTo;
          const from =
            previous === undefined ? rules.minimumPrice : rupiah(previous + 1);
          return (
            <tr key={from}>
              <td>
                <NumberText>
                  {band.upTo === undefined
                    ? m.learning_range_above_label({ from: formatRupiah(from) })
                    : m.learning_range_inclusive_label({
                        from: formatRupiah(from),
                        to: formatRupiah(band.upTo),
                      })}
                </NumberText>
              </td>
              <td>
                <NumberText whole>+{formatLimit(band.upper)}</NumberText>
              </td>
              <td>
                <NumberText whole>−{formatLimit(band.lower)}</NumberText>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
