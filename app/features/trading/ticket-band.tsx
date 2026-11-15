import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatNumber, formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { Rupiah } from "~/units/rupiah";
import type { PriceRange } from "./accepted-prices";
import styles from "./ticket.module.css";
import { fractionOf } from "~/charts/scale";
import { percentOf } from "~/charts/plot";
import { plotFraction } from "~/units/plot-fraction";

export function TicketBand({
  range,
  price,
}: {
  range: PriceRange;
  price: Rupiah | undefined;
}): ReactNode {
  const position = (value: Rupiah) =>
    percentOf(
      plotFraction(
        Math.max(
          0,
          Math.min(
            1,
            fractionOf({ min: range.lowest, max: range.highest }, value),
          ),
        ),
      ),
    );
  return (
    <div>
      <svg className={styles["band"]} aria-hidden="true">
        <line
          className={styles["reference"]}
          x1={position(range.reference)}
          x2={position(range.reference)}
          y1="25%"
          y2="75%"
        />
        {price !== undefined && (
          <line
            className={styles["marker"]}
            data-negative={price < range.lowest || price > range.highest}
            x1={position(price)}
            x2={position(price)}
            y1="20%"
            y2="80%"
          />
        )}
      </svg>
      <div className={styles["bandLabels"]}>
        <span>
          <NumberText>
            {m.trading_ticket_arb_label({ price: formatNumber(range.lowest) })}
          </NumberText>
        </span>
        <span>
          <NumberText>
            {m.trading_ticket_reference_label({
              price: formatNumber(range.reference),
            })}
          </NumberText>
          <ConceptHelp title={m.trading_ticket_band_title()}>
            <p>
              <NumberText>
                {m.trading_ticket_band_body({
                  reference: formatRupiah(range.reference),
                  low: formatRupiah(range.lowest),
                  high: formatRupiah(range.highest),
                })}
              </NumberText>
            </p>
            <ConceptLesson termId="ara" />
          </ConceptHelp>
        </span>
        <span>
          <NumberText>
            {m.trading_ticket_ara_label({ price: formatNumber(range.highest) })}
          </NumberText>
        </span>
      </div>
    </div>
  );
}
