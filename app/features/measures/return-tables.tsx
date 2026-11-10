import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import type { ClosePrice } from "~/features/market-data/price-source.server";
import {
  formatCalendarDate,
  formatNumber,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { ReturnMeasure } from "./aligned-returns";
import { instrumentName } from "./instrument-name";
import { MeasureTable } from "./measure-table";
import styles from "./measures.module.css";

/** A close at the end of a month, with the return of the month that it ends, or without one for a close that only starts a return. */
interface CloseRow {
  date: string;
  close: ClosePrice;
  return: MonthlyReturn | undefined;
}

/** The closes and the returns that measures use, in a table for each instrument that opens below its label, so a student can copy them into a spreadsheet. */
export function ReturnTables({
  instruments,
}: {
  instruments: readonly { code: string; returns: readonly ReturnMeasure[] }[];
}): ReactNode {
  return (
    <>
      <h2>{m.measures_returns_title()}</h2>
      <p>{m.measures_returns_notice()}</p>
      {instruments.map(({ code, returns }) => (
        <details key={code} className={styles["returns"]}>
          <summary>
            {m.measures_returns_table_label({ code: instrumentName(code) })}
          </summary>
          <MeasureTable
            header={[
              m.measures_close_date_label(),
              m.measures_close_label(),
              m.measures_return_label(),
            ]}
            rows={closeRows(returns).map((row) => ({
              key: row.date,
              name: formatCalendarDate(row.date, "medium"),
              cells: {
                kind: "numbers",
                values: [formatNumber(row.close), monthReturn(row.return)],
              },
            }))}
          />
        </details>
      ))}
    </>
  );
}

// MeasureTable puts each value in a cell of its own, so a value needs no key of a list.
function monthReturn(value: MonthlyReturn | undefined): ReactNode {
  return value === undefined ? null : (
    <ChangeText change={formatSignedPercent(value)} />
  );
}

/** The closes of the returns of an instrument, oldest first. A return whose start is not the end of the return before it, because a month in between is not among the months of the measures, gets a row for its start without a return. */
function closeRows(returns: readonly ReturnMeasure[]): CloseRow[] {
  const rows: CloseRow[] = [];
  for (const { value, inputs } of returns) {
    if (rows.at(-1)?.date !== inputs.startDate) {
      rows.push({
        date: inputs.startDate,
        close: inputs.startClose,
        return: undefined,
      });
    }
    rows.push({ date: inputs.endDate, close: inputs.endClose, return: value });
  }
  return rows;
}
