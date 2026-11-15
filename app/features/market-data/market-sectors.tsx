import type { ReactNode } from "react";
import chipStyles from "~/chip.module.css";
import { FieldFailure } from "~/described-field";
import { formatNumber } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { companyOf } from "./company-of";
import type { MarketRow } from "./filter-market-rows";
import { marketChoiceLabel, marketSectorOptions } from "./market-filters";
import type { MarketFilters } from "./market-filters";
import styles from "./market-view.module.css";

export function MarketSectors({
  rows,
  value,
  failure,
  onChange,
}: {
  rows: readonly MarketRow[];
  value: string;
  failure: string | undefined;
  onChange: (sector: MarketFilters["sector"]) => void;
}): ReactNode {
  const chipClassName = [styles["chip"], chipStyles["filter"]].join(" ");
  const options = marketSectorOptions()
    .map((option) => ({
      ...option,
      count:
        option.value === "all"
          ? rows.length
          : rows.filter((row) => companyOf(row.code).sector === option.value)
              .length,
    }))
    .filter(
      (option) =>
        option.value === "all" || option.count > 0 || option.value === value,
    );
  return (
    <fieldset className={styles["sectors"]}>
      <legend>{m.market_data_sector_label()}</legend>
      <div className={styles["chipList"]}>
        {failure !== undefined && (
          <label className={chipClassName}>
            <input type="radio" name="sector" value={value} defaultChecked />
            <NumberText verbatim>{marketChoiceLabel(value)}</NumberText>
          </label>
        )}
        {options.map(({ value: sector, label, count }) => (
          <label key={sector} className={chipClassName}>
            <input
              type="radio"
              name="sector"
              value={sector}
              defaultChecked={value === sector}
              onChange={() => {
                onChange(sector);
              }}
            />
            <NumberText>
              {(textValue) =>
                m.market_data_chip_label({
                  sector: textValue(label),
                  count: formatNumber(count),
                })
              }
            </NumberText>
          </label>
        ))}
      </div>
      <FieldFailure id="sector-failure" text={failure} quotedValue={value} />
    </fieldset>
  );
}
