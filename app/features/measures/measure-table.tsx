import { TableHead } from "~/table-head";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import tableStyles from "~/data-table.module.css";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import type { ClassId } from "~/features/classes/classes.schema";
import styles from "./measures.module.css";
import { stockPath } from "~/features/market-data/stock-path";

/** A row of a table of measures: its name, such as the code of a stock, and a number for each other column, or a note that takes the place of all of them, such as why a stock has no measures. */
export interface MeasureTableRow {
  key: string;
  name: ReactNode;
  cells:
    | { kind: "numbers"; values: readonly ReactNode[] }
    | { kind: "note"; text: string };
}

/** A table of measures with a label for each column, the name of each row at its start, and the numbers of each row in the font for numbers. */
export function MeasureTable({
  header,
  rows,
}: {
  /** The label of each column, from the column of the names on. */
  header: readonly string[];
  rows: readonly MeasureTableRow[];
}): ReactNode {
  const [, ...valueColumns] = header;
  return (
    <table className={tableStyles["table"]}>
      <TableHead labels={header} />
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <th scope="row">{row.name}</th>
            <RowCells cells={row.cells} columns={valueColumns} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RowCells({
  cells,
  columns,
}: {
  cells: MeasureTableRow["cells"];
  columns: readonly string[];
}): ReactNode {
  switch (cells.kind) {
    case "numbers":
      return cells.values.map((value, index) => (
        <td key={columns[index]} className={tableStyles["number"]}>
          {value}
        </td>
      ));
    case "note":
      return <td colSpan={columns.length}>{cells.text}</td>;
  }
}

/** The code of a stock as a link to the page of its measures, with the height of a touch target. */
export function StockLink({
  classId,
  code,
  id,
}: {
  classId: ClassId;
  code: string;
  id: string;
}): ReactNode {
  const { pathname, search } = useLocation();
  return (
    <Link
      id={id}
      to={pathReturningTo(
        stockPath(classId, code),
        `${pathname}${search}#${id}`,
      )}
      className={styles["link"]}
    >
      {code}
    </Link>
  );
}
