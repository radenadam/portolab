import { LessonTaskBanner } from "~/features/learning/lesson-task-banner";
import { type LessonTask } from "~/features/learning/lesson-task";
import { MarketNotes } from "./market-notes";
import { MarketMeasureNotes } from "./market-measure-notes";
import { sharedQuoteTime } from "./shared-quote-time";
import { MarketEmpty } from "./market-empty";
import { useMarketFilters } from "./use-market-filters";
import type { ReactNode } from "react";
import { MarketForm } from "./market-form";
import { OtherQuoteTimes } from "./other-quote-times";
import { MarketMap } from "./market-map";
import type { readMarketMap } from "./read-market-map.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { countedText } from "~/counted-text";
import { formatCalendarDate, formatNumber } from "~/formatting";
import { wibDateOf } from "~/wib";
import { m } from "~/paraglide/messages.js";
import { NumberText } from "~/number-text";
import { MarketTable } from "./market-table";
import type { MarketFilters } from "./market-filters";
import { filterMarketRows } from "./filter-market-rows";
import { marketSearch } from "./market-search";
import { marketPath } from "./market-path";
import { PriceStatus } from "./price-status";
import type { readMarket } from "./read-market.server";
import styles from "./market-view.module.css";

type Failures = Record<keyof MarketFilters, string | undefined>;
type MarketViewProps = ReturnType<typeof readMarket> & {
  classId: ClassId;
  task?: LessonTask | undefined;
  filters: MarketFilters;
  failures: Failures;
  values: Record<keyof MarketFilters, string>;
  map?: ReturnType<typeof readMarketMap> | undefined;
};

export function MarketView(props: MarketViewProps): ReactNode {
  const { classId, filters, rows, latestAttempt } = props;
  const { live, setLive, formRef } = useMarketFilters(filters);
  const shown = filterMarketRows(rows, live);
  const sharedTime = sharedQuoteTime([
    props.indexQuote,
    ...shown.map((row) => row.quote),
  ]);
  const failed = new Set(latestAttempt?.failedCodes);
  return (
    <div className={styles["market"]}>
      <LessonTaskBanner classId={classId} task={props.task} />
      <MarketForm
        props={props}
        live={live}
        setLive={setLive}
        formRef={formRef}
        sharedTime={sharedTime}
        failed={failed}
      />
      {!props.universeAvailable && (
        <p className={styles["notice"]}>
          <NumberText>
            {m.market_data_universe_notice({
              date: formatCalendarDate(wibDateOf(props.now)),
            })}
          </NumberText>
        </p>
      )}
      {props.universeAvailable &&
        filters.view === "map" &&
        shown.length > 0 && (
          <MarketMap
            rows={shown}
            map={props.map}
            reference={props.marketReference}
            filters={live}
            classId={classId}
            task={props.task}
            sharedTime={sharedTime}
            failed={failed}
          />
        )}
      {props.universeAvailable &&
        (filters.view === "list" || shown.length === 0) && (
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
      {filters.view === "map" && (
        <OtherQuoteTimes
          quotes={props.quotes.filter(
            (quote) =>
              shown.some((row) => row.code === quote.code) ||
              props.map?.heldCodes.includes(quote.code),
          )}
          sharedTime={sharedTime}
          className={styles["status"]}
        />
      )}
      <MarketNotes
        rows={shown}
        sharedTime={sharedTime}
        indexQuote={props.indexQuote}
        reference={props.marketReference}
        index={props.index}
        view={filters.view}
      />
      {filters.view === "list" && <MarketMeasureNotes rows={shown} />}
      <PriceStatus
        quotes={props.quotes}
        latestAttempt={latestAttempt}
        now={props.now}
        source={props.source}
      />
    </div>
  );
}
