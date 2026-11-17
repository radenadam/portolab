import type { ReactNode } from "react";
import { FieldFailure } from "~/described-field";
import { m } from "~/paraglide/messages.js";
import { FilterOptions } from "./filter-options";
import {
  marketViewOptions,
  marketAxisOptions,
  marketRangeOptions,
  marketChoiceLabel,
} from "./market-filters";
import type { MarketFilters } from "./market-filters";
import styles from "./market-view.module.css";

export function MarketMapFields({
  filters,
  values,
  failures,
}: {
  filters: MarketFilters;
  values: Record<keyof MarketFilters, string>;
  failures: Partial<Record<keyof MarketFilters, string | undefined>>;
}): ReactNode {
  return [
    {
      name: "view" as const,
      label: m.market_data_view_label(),
      options: marketViewOptions(),
    },
    {
      name: "axis" as const,
      label: m.market_data_map_axis_label(),
      options: marketAxisOptions(),
    },
    {
      name: "mapRange" as const,
      label: m.market_data_map_range_label(),
      options: marketRangeOptions(),
    },
  ].map(({ name, label, options }) =>
    failures[name] === undefined ? (
      <input key={name} type="hidden" name={name} value={filters[name]} />
    ) : (
      <div key={name} className={styles["select"]}>
        <label htmlFor={`market-${name}`}>{label}</label>
        <select
          className={styles["control"]}
          id={`market-${name}`}
          name={name}
          defaultValue={values[name]}
          aria-invalid
          aria-describedby={`market-${name}-failure`}
        >
          <FilterOptions options={options} value={values[name]} />
        </select>
        <FieldFailure
          id={`market-${name}-failure`}
          text={failures[name]}
          quotedValue={marketChoiceLabel(values[name])}
        />
      </div>
    ),
  );
}
