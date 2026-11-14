import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { ChangeText } from "~/change-text";
import legendStyles from "~/chart-legend.module.css";
import tableStyles from "~/data-table.module.css";
import { formatCalendarDate, formatSignedPercent } from "~/formatting";
import { LineKey } from "./line-key";
import { layoutTimeChart } from "./time-chart-layout";
import type { TimeChartLayout, TimeLine } from "./time-chart-layout";
import styles from "./time-chart.module.css";
import { TimePlot } from "./time-plot";
import type { ValueAxisSide } from "./value-mark";

const noAnnotations: readonly { date: string; label: string }[] = [];

/** A chart of the returns of one or two lines at the close of each trading day, with a legend when it compares lines and a table of every point, as decision 0029 sets. The server draws it in SVG, so it shows before JavaScript loads. Once JavaScript runs, its plot is a slider that a pointer, a finger, or the keys move along the dates, which marks a date with a crosshair and shows the returns of the date in a tooltip. */
export function TimeChart<Point extends { date: string }>({
  points,
  lines,
  labelledBy,
  dateLabel,
  tableLabel,
  coloredChanges = false,
  annotations = noAnnotations,
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
  coloredChanges?: boolean;
  annotations?: readonly { date: string; label: string }[] | undefined;
}): ReactNode {
  if (points.length === 0) return null;
  const layout = layoutTimeChart(
    points.map((point) => point.date),
    lines.map((line) => ({
      kind: line.kind,
      values: points.map(line.valueOf),
    })),
  );
  return (
    <TimeSeriesChart
      points={points}
      lines={lines}
      layout={layout}
      labelledBy={labelledBy}
      dateLabel={dateLabel}
      tableLabel={tableLabel}
      annotations={annotations}
      columnWidths={[
        "var(--width-close-column)",
        ...lines.slice(0, -1).map(() => "var(--width-return-column)"),
      ]}
      valueText={(value: CumulativeReturn) => formatSignedPercent(value).text}
      valueNode={(value: CumulativeReturn) => (
        <ChangeText
          colored={coloredChanges}
          change={formatSignedPercent(value)}
        />
      )}
    />
  );
}

/** Prices and returns share their table, legend, and interactive plot while retaining their own units and formats. */
export function TimeSeriesChart<
  Point extends { date: string },
  Value extends number,
>({
  points,
  lines,
  layout,
  labelledBy,
  dateLabel,
  tableLabel,
  valueText,
  valueNode,
  area = false,
  axisSide = "left",
  annotations = noAnnotations,
  columnWidths,
}: {
  points: readonly Point[];
  lines: readonly TimeLine<Point, Value>[];
  layout: TimeChartLayout;
  labelledBy: string;
  dateLabel: string;
  tableLabel: string;
  valueText: (value: Value) => string;
  valueNode: (value: Value) => ReactNode;
  area?: boolean;
  axisSide?: ValueAxisSide;
  annotations?: readonly { date: string; label: string }[] | undefined;
  columnWidths?: readonly string[];
}): ReactNode {
  const latest = points.at(-1);
  if (latest === undefined) return null;
  return (
    <div className={styles["timeChart"]}>
      {lines.length > 1 && (
        <ul className={legendStyles["legend"]}>
          {lines.map((line) => (
            <li key={line.name} className={styles["legendItem"]}>
              <LineKey kind={line.kind} />
              <NumberText>{line.name}</NumberText>{" "}
              <NumberText whole>{valueNode(line.valueOf(latest))}</NumberText>
            </li>
          ))}
        </ul>
      )}
      <TimePlot
        points={points}
        lines={lines}
        layout={layout}
        labelledBy={labelledBy}
        valueText={valueText}
        valueNode={valueNode}
        area={area}
        axisSide={axisSide}
        annotations={annotations}
      />
      <details className={styles["points"]}>
        <summary>
          <NumberText>{tableLabel}</NumberText>
        </summary>
        <table
          className={[
            tableStyles["table"],
            columnWidths === undefined ? undefined : styles["fixedTable"],
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {columnWidths !== undefined && (
            <colgroup>
              {columnWidths.map((width) => (
                <col key={width} style={{ width }} />
              ))}
              <col />
            </colgroup>
          )}
          <thead>
            <tr>
              <th scope="col">
                <NumberText>{dateLabel}</NumberText>
              </th>
              {lines.map((line) => (
                <th key={line.name} scope="col">
                  <NumberText>{line.name}</NumberText>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.date}>
                <th scope="row">
                  <NumberText>
                    {formatCalendarDate(point.date, "medium")}
                  </NumberText>
                </th>
                {lines.map((line) => (
                  <td key={line.name} className={tableStyles["number"]}>
                    <NumberText whole>
                      {valueNode(line.valueOf(point))}
                    </NumberText>
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
