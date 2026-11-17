import type { ComponentProps, RefObject, ReactNode } from "react";
import type { MarketView } from "./market-view";
import { MarketSectors } from "./market-sectors";
import { MarketOrder } from "./market-order";
import { Icon } from "~/icon";
import { lessonTaskField } from "~/features/learning/lesson-task";
import { FilterOptions } from "./filter-options";
import { MarketMeasureHelp } from "./market-measure-help";
import { Form, Link } from "react-router";
import { MarketMapFields } from "./market-map-fields";
import { m } from "~/paraglide/messages.js";
import { FieldFailure } from "~/described-field";
import { IhsgCard } from "./ihsg-card";
import {
  marketChoiceLabel,
  marketRangeOptions,
  marketViewOptions,
} from "./market-filters";
import type { MarketFilters, MarketSort } from "./market-filters";
import { marketSearch } from "./market-search";
import { marketPath } from "./market-path";
import styles from "./market-view.module.css";

const mobileConcepts: Record<MarketSort, "beta" | "risk" | undefined> = {
  change: undefined,
  price: undefined,
  code: undefined,
  beta: "beta",
  volatility: "risk",
};

export function MarketForm({
  props,
  live,
  setLive,
  formRef,
  sharedTime,
  failed,
}: {
  props: ComponentProps<typeof MarketView>;
  live: MarketFilters;
  setLive: (filters: MarketFilters) => void;
  formRef: RefObject<HTMLFormElement | null>;
  sharedTime: Date | undefined;
  failed: ReadonlySet<string>;
}): ReactNode {
  const {
    classId,
    filters,
    rows,
    failures,
    values,
    task,
    index,
    indexQuote,
    indexCloses,
    marketReference,
  } = props;
  const mobileConcept = mobileConcepts[live.sort];
  return (
    <Form
      ref={formRef}
      key={JSON.stringify(filters)}
      method="get"
      action={marketPath(classId)}
      className={styles["form"]}
    >
      {task !== undefined && (
        <input type="hidden" name={lessonTaskField} value={String(task)} />
      )}
      <header className={styles["tools"]}>
        <h1>{m.market_data_page_title()}</h1>
        <nav
          className={styles["viewChoice"]}
          aria-label={m.market_data_view_label()}
        >
          {marketViewOptions().map(({ value, label }) => (
            <Link
              key={value}
              to={marketSearch({ ...live, view: value }, task)}
              aria-current={filters.view === value ? "true" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles["search"]}>
          {failures.query !== undefined && (
            <label htmlFor="market-search">
              {m.market_data_search_label()}
            </label>
          )}
          <div className={styles["searchField"]}>
            <button
              type="submit"
              className={styles["searchSubmit"]}
              aria-label={m.market_data_apply_label()}
            >
              <Icon name="search" className={styles["searchIcon"]} />
            </button>
            <input
              id="market-search"
              name="q"
              type="search"
              defaultValue={values.query}
              onChange={(event) => {
                setLive({ ...live, query: event.currentTarget.value });
              }}
              placeholder={m.market_data_search_hint()}
              aria-label={m.market_data_search_label()}
              aria-invalid={failures.query !== undefined}
              aria-describedby={
                failures.query === undefined ? undefined : "search-failure"
              }
            />
          </div>
          <FieldFailure
            id="search-failure"
            text={failures.query}
            quotedValue={values.query}
          />
        </div>
      </header>
      <MarketMapFields filters={filters} values={values} failures={failures} />
      {failures.range === undefined ? (
        <input type="hidden" name="range" value={filters.range} />
      ) : (
        <div className={styles["select"]}>
          <label htmlFor="market-range">
            {m.market_data_range_label({ index: index })}
          </label>
          <select
            className={styles["control"]}
            id="market-range"
            name="range"
            defaultValue={values.range}
            aria-label={m.market_data_range_label({ index: index })}
            aria-invalid
            aria-describedby="range-failure"
          >
            <FilterOptions
              options={marketRangeOptions()}
              value={values.range}
            />
          </select>
          <FieldFailure
            id="range-failure"
            text={failures.range}
            quotedValue={marketChoiceLabel(values.range)}
          />
        </div>
      )}
      <IhsgCard
        index={index}
        quote={indexQuote}
        closes={indexCloses}
        filters={live}
        missed={failed.has("IHSG")}
        sharedTime={sharedTime}
        task={task}
      />
      <div className={styles["filters"]}>
        <MarketSectors
          rows={rows}
          value={values.sector}
          failure={failures.sector}
          onChange={(sector) => {
            setLive({ ...live, sector });
          }}
        />
        {filters.view === "list" ||
        failures.sort !== undefined ||
        failures.direction !== undefined ? (
          <MarketOrder
            classId={classId}
            live={live}
            values={values}
            failures={failures}
            task={task}
            setLive={setLive}
          />
        ) : (
          <>
            <input type="hidden" name="sort" value={filters.sort} />
            <input type="hidden" name="direction" value={filters.direction} />
          </>
        )}
        {filters.view === "list" && mobileConcept !== undefined && (
          <div className={styles["mobileHelp"]}>
            <MarketMeasureHelp
              kind={mobileConcept}
              reference={marketReference}
              index={index}
            />
          </div>
        )}
      </div>
    </Form>
  );
}
