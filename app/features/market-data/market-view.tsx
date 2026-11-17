import { MarketSectors } from "./market-sectors";
import { MarketOrder } from "./market-order";
import { Icon } from "~/icon";
import { LessonTaskBanner } from "~/features/learning/lesson-task-banner";
import {
  lessonTaskField,
  type LessonTask,
} from "~/features/learning/lesson-task";
import { FilterOptions } from "./filter-options";
import { MarketMeasureHelp } from "./market-measure-help";
import { MarketNotes } from "./market-notes";
import { MarketMeasureNotes } from "./market-measure-notes";
import { sharedQuoteTime } from "./shared-quote-time";
import { MarketEmpty } from "./market-empty";
import { useMarketFilters } from "./use-market-filters";
import type { ReactNode } from "react";
import { Form } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { countedText } from "~/counted-text";
import { formatCalendarDate, formatNumber } from "~/formatting";
import { wibDateOf } from "~/wib";
import { m } from "~/paraglide/messages.js";
import { NumberText } from "~/number-text";
import { FieldFailure } from "~/described-field";
import { MarketTable } from "./market-table";
import { IhsgCard } from "./ihsg-card";
import { marketChoiceLabel, marketRangeOptions } from "./market-filters";
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
  task?: LessonTask | undefined;
  filters: MarketFilters;
  failures: Failures;
  values: Record<keyof MarketFilters, string>;
};

export function MarketView(props: MarketViewProps): ReactNode {
  const { classId, filters, rows, latestAttempt, failures, values } = props;
  const { live, setLive, formRef } = useMarketFilters(filters);
  const mobileConcept = mobileConcepts[live.sort];
  const shown = filterMarketRows(rows, live);
  const sharedTime = sharedQuoteTime([
    props.indexQuote,
    ...shown.map((row) => row.quote),
  ]);
  const failed = new Set(latestAttempt?.failedCodes);
  return (
    <div className={styles["market"]}>
      <LessonTaskBanner classId={classId} task={props.task} />
      <Form
        ref={formRef}
        key={JSON.stringify(filters)}
        method="get"
        action={marketPath(classId)}
        className={styles["form"]}
      >
        {props.task !== undefined && (
          <input
            type="hidden"
            name={lessonTaskField}
            value={String(props.task)}
          />
        )}
        <header className={styles["tools"]}>
          <h1>{m.market_data_page_title()}</h1>
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
        {failures.range === undefined ? (
          <input type="hidden" name="range" value={filters.range} />
        ) : (
          <div className={styles["select"]}>
            <label htmlFor="market-range">
              {m.market_data_range_label({ index: props.index })}
            </label>
            <select
              className={styles["control"]}
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
            <FieldFailure
              id="range-failure"
              text={failures.range}
              quotedValue={marketChoiceLabel(values.range)}
            />
          </div>
        )}
        <IhsgCard
          index={props.index}
          quote={props.indexQuote}
          closes={props.indexCloses}
          filters={live}
          missed={failed.has("IHSG")}
          sharedTime={sharedTime}
          task={props.task}
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
          <MarketOrder
            classId={classId}
            live={live}
            values={values}
            failures={failures}
            task={props.task}
            setLive={setLive}
          />
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
          <NumberText>
            {m.market_data_universe_notice({
              date: formatCalendarDate(wibDateOf(props.now)),
            })}
          </NumberText>
        </p>
      )}
      {props.universeAvailable && (
        <section
          className={styles["listPanel"]}
          aria-labelledby="stocks-heading"
          data-layout="panel"
        >
          <h2 id="stocks-heading">
            <NumberText>
              {countedText(
                shown.length,
                {
                  one: m.market_data_one_stock_title,
                  several: m.market_data_several_stocks_title,
                },
                { count: formatNumber(shown.length) },
              )}
            </NumberText>
          </h2>
          {shown.length === 0 ? (
            <MarketEmpty classId={classId} filters={live} task={props.task} />
          ) : (
            <MarketTable
              rows={shown}
              classId={classId}
              failed={failed}
              indexQuote={props.indexQuote}
              sort={live.sort}
              returnPath={`${marketPath(classId)}${marketSearch(live, props.task)}`}
              reference={props.marketReference}
              index={props.index}
              sharedTime={sharedTime}
              task={props.task}
            />
          )}
        </section>
      )}
      <MarketNotes
        rows={shown}
        sharedTime={sharedTime}
        indexQuote={props.indexQuote}
        reference={props.marketReference}
        index={props.index}
      />
      <MarketMeasureNotes rows={shown} />
      <PriceStatus
        quotes={props.quotes}
        latestAttempt={latestAttempt}
        now={props.now}
        source={props.source}
      />
    </div>
  );
}
