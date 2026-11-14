import { FilterOptions } from "./filter-options";
import { MarketMeasureHelp } from "./market-measure-help";
import { monthSpanInputs } from "~/features/measures/month-span";
import { useMarketFilters } from "./use-market-filters";
import type { ReactNode } from "react";
import { Form, Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { countedText } from "~/counted-text";
import { formatCalendarDate, formatNumber } from "~/formatting";
import { wibDateOf } from "~/wib";
import { m } from "~/paraglide/messages.js";
import { FieldFailure } from "~/described-field";
import { companyOf } from "./company-of";
import { MarketTable } from "./market-table";
import { IhsgCard } from "./ihsg-card";
import {
  marketSorts,
  marketSortOptions,
  marketDirectionOptions,
  marketRangeOptions,
  marketSectorOptions,
} from "./market-filters";
import type { MarketFilters, MarketSort } from "./market-filters";
import { filterMarketRows } from "./filter-market-rows";
import { marketSearch } from "./market-search";
import { marketPath } from "./market-path";
import { PriceStatus } from "./price-status";
import type { readMarket } from "./read-market.server";
import styles from "./market-view.module.css";

const mobileConcepts: Record<MarketSort, "beta" | "risk" | undefined> = {
  change: undefined,
  price: undefined,
  code: undefined,
  beta: "beta",
  volatility: "risk",
};

type Failures = Record<keyof MarketFilters, string | undefined>;
type MarketViewProps = ReturnType<typeof readMarket> & {
  classId: ClassId;
  filters: MarketFilters;
  failures: Failures;
  values: Record<keyof MarketFilters, string>;
};

/** Native GET submission must keep filtering available before JavaScript loads. */
export function MarketView(props: MarketViewProps): ReactNode {
  const { classId, filters, rows, latestAttempt, failures, values } = props;
  const { live, setLive, formRef } = useMarketFilters(filters);
  const mobileConcept = mobileConcepts[live.sort];
  const shown = filterMarketRows(rows, live);
  const sectorOptions = marketSectorOptions()
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
        option.value === "all" ||
        option.count > 0 ||
        option.value === values.sector,
    );
  const failed = new Set(latestAttempt?.failedCodes);
  return (
    <div className={styles["market"]}>
      <Form
        ref={formRef}
        key={JSON.stringify(filters)}
        method="get"
        action={marketPath(classId)}
        className={styles["form"]}
      >
        <header className={styles["tools"]}>
          <h1>{m.market_data_page_title()}</h1>
          <div className={styles["search"]}>
            <label htmlFor="market-search">
              {m.market_data_search_label()}
            </label>
            <input
              id="market-search"
              name="q"
              type="search"
              defaultValue={values.query}
              onChange={(event) => {
                setLive({ ...live, query: event.currentTarget.value });
              }}
              placeholder={m.market_data_search_hint()}
              aria-invalid={failures.query !== undefined}
              aria-describedby={
                failures.query === undefined ? undefined : "search-failure"
              }
            />
            <FieldFailure id="search-failure" text={failures.query} />
          </div>
          <button type="submit" className={styles["apply"]}>
            {m.market_data_apply_label()}
          </button>
        </header>
        {failures.range === undefined ? (
          <input type="hidden" name="range" value={filters.range} />
        ) : (
          <div className={styles["select"]}>
            <label htmlFor="market-range">
              {m.market_data_range_label({ index: props.index })}
            </label>
            <select
              id="market-range"
              name="range"
              defaultValue={values.range}
              aria-label={m.market_data_range_label({ index: props.index })}
              aria-invalid
              aria-describedby="range-failure"
            >
              <FilterOptions
                options={marketRangeOptions()}
                value={values.range}
              />
            </select>
            <FieldFailure id="range-failure" text={failures.range} />
          </div>
        )}
        <IhsgCard
          index={props.index}
          quote={props.indexQuote}
          closes={props.indexCloses}
          filters={live}
          missed={failed.has("IHSG")}
        />
        <div className={styles["filters"]}>
          <fieldset className={styles["sectors"]}>
            <legend>{m.market_data_sector_label()}</legend>
            <div className={styles["chipList"]}>
              {failures.sector !== undefined && (
                <label className={styles["chip"]}>
                  <input
                    type="radio"
                    name="sector"
                    value={values.sector}
                    defaultChecked
                  />
                  <span>{values.sector}</span>
                </label>
              )}
              {sectorOptions.map(({ value: sector, label, count }) => (
                <label key={sector} className={styles["chip"]}>
                  <input
                    type="radio"
                    name="sector"
                    value={sector}
                    defaultChecked={values.sector === sector}
                    onChange={() => {
                      setLive({ ...live, sector });
                    }}
                  />
                  <span>
                    {m.market_data_chip_label({
                      sector: label,
                      count: formatNumber(count),
                    })}
                  </span>
                </label>
              ))}
            </div>
            <FieldFailure id="sector-failure" text={failures.sector} />
          </fieldset>
          <div className={styles["select"]}>
            <label htmlFor="market-sort">{m.market_data_sort_label()}</label>
            <select
              id="market-sort"
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
              <FilterOptions
                options={marketSortOptions()}
                value={values.sort}
              />
            </select>
            <FieldFailure id="sort-failure" text={failures.sort} />
          </div>
          <div className={styles["select"]}>
            <label htmlFor="market-direction">
              {m.market_data_direction_label()}
            </label>
            <select
              id="market-direction"
              name="direction"
              aria-label={m.market_data_direction_label()}
              aria-invalid={failures.direction !== undefined}
              aria-describedby={
                failures.direction === undefined
                  ? undefined
                  : "direction-failure"
              }
              defaultValue={values.direction}
              onChange={(event) => {
                setLive({
                  ...live,
                  direction:
                    event.currentTarget.value === "ascending"
                      ? "ascending"
                      : "descending",
                });
              }}
            >
              <FilterOptions
                options={marketDirectionOptions()}
                value={values.direction}
              />
            </select>
            <FieldFailure id="direction-failure" text={failures.direction} />
          </div>
          {mobileConcept !== undefined && (
            <div className={styles["mobileHelp"]}>
              <MarketMeasureHelp
                kind={mobileConcept}
                reference={props.marketReference}
                index={props.index}
              />
            </div>
          )}
        </div>
      </Form>
      {!props.universeAvailable && (
        <p className={styles["notice"]}>
          {m.market_data_universe_notice({
            date: formatCalendarDate(wibDateOf(props.now)),
          })}
        </p>
      )}
      {props.universeAvailable && (
        <section
          className={styles["listPanel"]}
          aria-labelledby="stocks-heading"
          data-layout="panel"
        >
          <h2 id="stocks-heading">
            {countedText(
              shown.length,
              {
                one: m.market_data_one_stock_title,
                several: m.market_data_several_stocks_title,
              },
              { count: formatNumber(shown.length) },
            )}
          </h2>
          {shown.length === 0 ? (
            <div className={styles["empty"]}>
              <p>
                {m.market_data_no_results_notice({ query: live.query.trim() })}
              </p>
              <Link
                to={`${marketPath(classId)}${marketSearch({ ...live, query: "", sector: "all" })}`}
              >
                {m.market_data_clear_link()}
              </Link>
            </div>
          ) : (
            <MarketTable
              rows={shown}
              classId={classId}
              failed={failed}
              indexQuote={props.indexQuote}
              sort={live.sort}
              returnPath={`${marketPath(classId)}${marketSearch(live)}`}
              reference={props.marketReference}
              index={props.index}
            />
          )}
        </section>
      )}
      {props.marketReference.ok && (
        <p className={styles["status"]}>
          {m.market_data_reference_notice({
            index: props.index,
            ...monthSpanInputs(props.marketReference.value.months),
          })}
        </p>
      )}
      <PriceStatus
        quotes={props.quotes}
        latestAttempt={latestAttempt}
        now={props.now}
        source={props.source}
      />
    </div>
  );
}
