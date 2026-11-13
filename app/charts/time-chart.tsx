import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import legendStyles from "~/chart-legend.module.css";
import tableStyles from "~/data-table.module.css";
import { formatCalendarDate, formatSignedPercent } from "~/formatting";
import { LineKey } from "./line-key";
import { layoutTimeChart } from "./time-chart-layout";
import type { TimeLine } from "./time-chart-layout";
import styles from "./time-chart.module.css";
import { TimePlot } from "./time-plot";

/** A chart of the returns of one or two lines at the close of each trading day, with a legend that names each line with its latest return, and a table of every point, as decision 0029 sets. The server draws it in SVG, so it shows before JavaScript loads. Once JavaScript runs, its plot is a slider that a pointer, a finger, or the keys move along the dates, which marks a date with a crosshair and shows the returns of the date in a tooltip. */
export function TimeChart<Point extends { date: string }>({
  points,
  lines,
  labelledBy,
  dateLabel,
  tableLabel,
}: {
  /** The points of the chart, oldest first, at least one. */
  points: readonly Point[];
  lines: readonly TimeLine<Point>[];
  /** The id of the heading that names the chart, which also names its slider. */
  labelledBy: string;
  /** The heading of the column of dates in the table of points. */
  dateLabel: string;
  /** The label that opens the table of points. */
  tableLabel: string;
}): ReactNode {
  const latest = points.at(-1);
  if (latest === undefined) {
    return null;
  }
  const layout = layoutTimeChart(
    points.map((point) => point.date),
    lines.map((line) => ({
      kind: line.kind,
      returns: points.map(line.returnOf),
    })),
  );
  return (
    <div className={styles["timeChart"]}>
      <ul className={legendStyles["legend"]}>
        {lines.map((line) => (
          <li key={line.name} className={styles["legendItem"]}>
            <LineKey kind={line.kind} />
            {line.name}{" "}
            <ChangeText change={formatSignedPercent(line.returnOf(latest))} />
          </li>
        ))}
      </ul>
      <TimePlot
        points={points}
        lines={lines}
        layout={layout}
        labelledBy={labelledBy}
      />
      <details className={styles["points"]}>
        <summary>{tableLabel}</summary>
        <table className={tableStyles["table"]}>
          <thead>
            <tr>
              <th scope="col">{dateLabel}</th>
              {lines.map((line) => (
                <th key={line.name} scope="col">
                  {line.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.date}>
                <th scope="row">{formatCalendarDate(point.date, "medium")}</th>
                {lines.map((line) => (
                  <td key={line.name} className={tableStyles["number"]}>
                    <ChangeText
                      change={formatSignedPercent(line.returnOf(point))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
