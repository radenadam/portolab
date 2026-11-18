import type { ComponentProps, ReactNode } from "react";
import { NumberText } from "~/number-text";
import { countedText } from "~/counted-text";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { MarketView } from "./market-view";
import type { MarketRow } from "./filter-market-rows";
import type { MarketFilters } from "./market-filters";
import { MarketEmpty } from "./market-empty";
import { MarketTable } from "./market-table";
import { marketPath } from "./market-path";
import { marketSearch } from "./market-search";
import styles from "./market-view.module.css";

export function MarketLists({
  props,
  rows,
  filters,
  failed,
  sharedTime,
}: {
  props: ComponentProps<typeof MarketView>;
  rows: readonly MarketRow[];
  filters: MarketFilters;
  failed: ReadonlySet<string>;
  sharedTime: Date | undefined;
}): ReactNode {
  const watched = new Set(props.watchedCodes);
  const watchedRows = rows.filter((row) => watched.has(row.code));
  const list = (
    items: readonly MarketRow[],
    {
      title,
      heading,
      rowPrefix,
    }: {
      title: string;
      heading: string;
      rowPrefix: ComponentProps<typeof MarketTable>["rowPrefix"];
    },
  ) => (
    <section
      className={styles["listPanel"]}
      aria-labelledby={heading}
      data-layout="panel"
    >
      <h2 id={heading}>
        <NumberText>{title}</NumberText>
      </h2>
      {items.length === 0 ? (
        <MarketEmpty
          classId={props.classId}
          filters={filters}
          task={props.task}
        />
      ) : (
        <MarketTable
          rows={items}
          scaleRows={props.rows}
          watchedCodes={watched}
          rowPrefix={rowPrefix}
          classId={props.classId}
          failed={failed}
          indexQuote={props.indexQuote}
          sort={filters.sort}
          returnPath={`${marketPath(props.classId)}${marketSearch(filters, props.task)}`}
          reference={props.marketReference}
          index={props.index}
          sharedTime={sharedTime}
          task={props.task}
        />
      )}
    </section>
  );
  return (
    <>
      {watchedRows.length > 0 &&
        list(watchedRows, {
          title: m.market_data_watchlist_title(),
          heading: "watchlist-heading",
          rowPrefix: "watched-stock",
        })}
      {list(rows, {
        title: countedText(
          rows.length,
          {
            one: m.market_data_one_stock_title,
            several: m.market_data_several_stocks_title,
          },
          { count: formatNumber(rows.length) },
        ),
        heading: "stocks-heading",
        rowPrefix: "stock",
      })}
    </>
  );
}
