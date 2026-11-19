import type { ReactNode } from "react";
import { Link } from "react-router";
import { FieldFailure } from "~/described-field";
import type { LessonTask } from "~/features/learning/lesson-task";
import type { ClassId } from "~/features/classes/classes.schema";
import { m } from "~/paraglide/messages.js";
import { FilterOptions } from "./filter-options";
import {
  marketChoiceLabel,
  marketDirectionOptions,
  marketSortOptions,
  marketSorts,
} from "./market-filters";
import type { MarketFilters } from "./market-filters";
import { marketPath } from "./market-path";
import { marketSearch } from "./market-search";
import styles from "./market-view.module.css";

const otherDirection: Record<
  MarketFilters["direction"],
  MarketFilters["direction"]
> = {
  descending: "ascending",
  ascending: "descending",
};

// The prototype of decision 0028 draws the order of the list with these icons, which only Pasar shows, so they stay out of the icons of the frame that every page loads.
const slidersPath = "M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5";
const descendingPath = "M7 4v16M3.5 16.5 7 20l3.5-3.5M13 6h8M13 11h6M13 16h4";

function OrderIcon({ path }: { path: string }): ReactNode {
  return (
    <svg
      className={styles["sortIcon"]}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const directionLinks: Record<MarketFilters["direction"], () => string> = {
  descending: m.market_data_ascending_link,
  ascending: m.market_data_descending_link,
};

/** The order of the list as the references draw it: the measure in a choice behind sliders, and the direction as a toggle. A choice that the address refused shows its label beside its error, so the error names a label that the reader sees. */
export function MarketOrder({
  classId,
  live,
  values,
  failures,
  task,
  setLive,
}: {
  classId: ClassId;
  live: MarketFilters;
  values: { sort: string; direction: string };
  failures: { sort?: string | undefined; direction?: string | undefined };
  task: LessonTask | undefined;
  setLive: (filters: MarketFilters) => void;
}): ReactNode {
  return (
    <div className={styles["order"]}>
      <div className={styles["select"]}>
        {failures.sort !== undefined && (
          <label htmlFor="market-sort">{m.market_data_sort_label()}</label>
        )}
        <div className={styles["sortControl"]}>
          <OrderIcon path={slidersPath} />
          <select
            id="market-sort"
            className={styles["sort"]}
            name="sort"
            aria-label={m.market_data_sort_label()}
            aria-invalid={failures.sort !== undefined}
            aria-describedby={
              failures.sort === undefined ? undefined : "sort-failure"
            }
            defaultValue={values.sort}
            onChange={(event) => {
              const sort = marketSorts.find(
                (value) => value === event.currentTarget.value,
              );
              if (sort !== undefined) setLive({ ...live, sort });
            }}
          >
            <FilterOptions options={marketSortOptions()} value={values.sort} />
          </select>
        </div>
        <FieldFailure
          id="sort-failure"
          text={failures.sort}
          quotedValue={marketChoiceLabel(values.sort)}
        />
      </div>
      {failures.direction === undefined ? (
        <>
          <input type="hidden" name="direction" value={live.direction} />
          <Link
            className={styles["direction"]}
            data-direction={live.direction}
            to={`${marketPath(classId)}${marketSearch(
              { ...live, direction: otherDirection[live.direction] },
              task,
            )}`}
            aria-label={directionLinks[live.direction]()}
            preventScrollReset
          >
            <OrderIcon path={descendingPath} />
          </Link>
        </>
      ) : (
        <div className={styles["select"]}>
          <label htmlFor="market-direction">
            {m.market_data_direction_label()}
          </label>
          <select
            className={styles["control"]}
            id="market-direction"
            name="direction"
            aria-invalid
            aria-describedby="direction-failure"
            defaultValue={values.direction}
            onChange={(event) => {
              const direction = marketDirectionOptions().find(
                (option) => option.value === event.currentTarget.value,
              );
              if (direction !== undefined)
                setLive({ ...live, direction: direction.value });
            }}
          >
            <FilterOptions
              options={marketDirectionOptions()}
              value={values.direction}
            />
          </select>
          <FieldFailure
            id="direction-failure"
            text={failures.direction}
            quotedValue={marketChoiceLabel(values.direction)}
          />
        </div>
      )}
    </div>
  );
}
