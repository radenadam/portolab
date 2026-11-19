import { NumberText } from "~/number-text";
import { Popover } from "~/popover";
import type { ReactNode } from "react";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { ChangeText } from "~/change-text";
import legendStyles from "~/chart-legend.module.css";
import tableStyles from "~/data-table.module.css";
import { formatMarketClock, formatSignedPercent } from "~/formatting";
import { TimePointLabel } from "./time-point-label";
import { LineKey } from "./line-key";
import { layoutTimeChart } from "./time-chart-layout";
import type { TimeChartLayout, TimeLine } from "./time-chart-layout";
import styles from "./time-chart.module.css";
import { TimePlot } from "./time-plot";
import type { ValueAxisSide } from "./value-mark";
import type { TimeEvent } from "./place-time-events";

/** Server rendering keeps dated closes and timed current points available before JavaScript loads. The table makes every plotted value readable without exploring the chart. */
export function TimeChart<Point extends { date: string; measuredAt?: Date }>({
  points,
  lines,
  labelledBy,
  dateLabel,
  tableLabel,
  coloredChanges = false,
  annotations,
  legendNote,
  tablePopover,
  tableNotice,
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
  annotations?: readonly TimeEvent[] | undefined;
  legendNote?: string | undefined;
  tablePopover?: string | undefined;
  tableNotice?: string | undefined;
}): ReactNode {
  if (points.length === 0) return null;
  const layout = layoutTimeChart(
    points.map((point) => point.date),
    lines.map((line) => ({
      kind: line.kind,
      values: points.map(line.valueOf),
    })),
  );
  const latest = points.at(-1);
  if (latest?.measuredAt !== undefined) {
    for (const tick of layout.dateTicks) {
      if (tick.at === 1) tick.text = formatMarketClock(latest.measuredAt);
    }
  }
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
      legendNote={legendNote}
      tablePopover={tablePopover}
      tableNotice={tableNotice}
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
  Point extends { date: string; measuredAt?: Date },
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
  annotations,
  columnWidths,
  legendNote,
  tablePopover,
  tableNotice,
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
  annotations?: readonly TimeEvent[] | undefined;
  columnWidths?: readonly string[];
  legendNote?: string | undefined;
  tablePopover?: string | undefined;
  tableNotice?: string | undefined;
}): ReactNode {
  const latest = points.at(-1);
  if (latest === undefined) return null;
  const legend =
    lines.length > 1 ? (
      <ul className={legendStyles["legend"]}>
        {lines.map((line) => (
          <li key={line.name} className={styles["legendItem"]}>
            <LineKey kind={line.kind} />
            <NumberText verbatim>{line.name}</NumberText>{" "}
            <NumberText whole>{valueNode(line.valueOf(latest))}</NumberText>
          </li>
        ))}
      </ul>
    ) : null;
  const table = (
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
              <NumberText verbatim>{line.name}</NumberText>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.measuredAt?.toISOString() ?? point.date}>
            <th scope="row">
              <TimePointLabel point={point} />
            </th>
            {lines.map((line) => (
              <td key={line.name} className={tableStyles["number"]}>
                <NumberText whole>{valueNode(line.valueOf(point))}</NumberText>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <div className={styles["timeChart"]}>
      {legendNote === undefined ? (
        legend
      ) : (
        <div className={styles["legendHeader"]}>
          {legend}
          <p>
            <NumberText>{legendNote}</NumberText>
          </p>
        </div>
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
      {tablePopover === undefined ? (
        <details className={styles["points"]}>
          <summary>
            <NumberText>{tableLabel}</NumberText>
          </summary>
          {table}
        </details>
      ) : (
        <Popover
          id={tablePopover}
          label={tableLabel}
          placement="belowEnd"
          tabStop
        >
          <div className={styles["tableCard"]}>
            <h2>
              <NumberText>{tableLabel}</NumberText>
            </h2>
            {tableNotice !== undefined && (
              <p>
                <NumberText>{tableNotice}</NumberText>
              </p>
            )}
            {table}
          </div>
        </Popover>
      )}
    </div>
  );
}
