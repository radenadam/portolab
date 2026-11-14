import type { ReactNode } from "react";
import { Link } from "react-router";
import { RiskMap } from "~/charts/risk-map";
import { RiskMapLegend } from "~/charts/risk-map-legend";
import type { MapValue, MarkedPoint } from "~/charts/layout-risk-map";
import {
  formatBeta,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { Popover, PopoverButton } from "~/popover";
import type { Beta } from "~/units/beta";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { beta } from "~/units/beta";
import { marketBeta } from "~/features/measures/market-beta";
import { monthlyReturn } from "~/units/monthly-return";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { ClassOverview } from "./read-class-overview.server";
import type { ClassMapAxis } from "./parse-class-map-axis";
import styles from "./class-overview.module.css";

export type ClassRisk = Beta | MonthlyReturn;

export type { ClassMapAxis } from "./parse-class-map-axis";

/** Links preserve the selected risk axis in the address, so the choice works before JavaScript loads. */
export function ClassMap({
  overview,
  axis,
  points,
}: {
  overview: ClassOverview;
  axis: ClassMapAxis;
  points: readonly MarkedPoint<ClassRisk, CumulativeReturn>[];
}): ReactNode {
  const active = points.filter((point) => point.mark.kind === "active").length;
  const inactive = points.length - active;
  const marketReturn = overview.summary.marketReturn;
  const axes: Record<
    ClassMapAxis,
    {
      title: string;
      style: "decimal" | "percent";
      toValue: (value: number) => ClassRisk;
      risk: ClassRisk | undefined;
    }
  > = {
    beta: {
      title: m.classes_map_beta_axis_label(),
      style: "decimal",
      toValue: beta,
      risk: marketBeta,
    },
    deviation: {
      title: m.classes_map_deviation_axis_label(),
      style: "percent",
      toValue: monthlyReturn,
      risk: overview.marketDeviation,
    },
  };
  const chosen = axes[axis];
  const marketRisk = chosen.risk;
  return (
    <section className={styles["panel"]} aria-labelledby="class-map-heading">
      <div className={styles["mapHeader"]}>
        <div className={styles["titleRow"]}>
          <h2 id="class-map-heading">{m.classes_map_title()}</h2>
          <PopoverButton
            popover="class-map-help"
            label={m.classes_map_help_label()}
            className={styles["help"]}
          >
            ?
          </PopoverButton>
          <Popover
            id="class-map-help"
            label={m.classes_map_help_label()}
            placement="belowEnd"
          >
            <p>{m.classes_map_help_notice()}</p>
          </Popover>
        </div>
        <div className={styles["choice"]}>
          <Link
            to="?axis=beta"
            aria-current={axis === "beta" ? "true" : undefined}
          >
            {m.classes_map_beta_label()}
          </Link>
          <Link
            to="?axis=deviation"
            aria-current={axis === "deviation" ? "true" : undefined}
          >
            {m.classes_map_deviation_label()}
          </Link>
        </div>
      </div>
      <div className={styles["legend"]}>
        <RiskMapLegend
          items={[
            {
              kind: "active",
              name:
                active === 1
                  ? m.classes_one_active_student_label({
                      count: formatNumber(active),
                    })
                  : m.classes_several_active_students_label({
                      count: formatNumber(active),
                    }),
            },
            {
              kind: "other",
              name:
                inactive === 1
                  ? m.classes_one_inactive_student_label({
                      count: formatNumber(inactive),
                    })
                  : m.classes_several_inactive_students_label({
                      count: formatNumber(inactive),
                    }),
            },
            { kind: "market", name: m.classes_map_market_label() },
          ]}
        />
      </div>
      {marketReturn === undefined || marketRisk === undefined ? (
        <p className={styles["empty"]}>{m.classes_map_unavailable_notice()}</p>
      ) : (
        <RiskMap
          labelledBy="class-map-heading"
          coloredValues
          market={{
            key: "IHSG",
            name: m.classes_map_market_label(),
            across: marketRisk,
            up: marketReturn,
            values: marketValues(marketReturn, overview.marketDeviation),
          }}
          points={points}
          across={chosen}
          up={{ style: "percent", toValue: cumulativeReturn }}
          levelLabel={m.app_map_value_part({
            name: m.classes_map_market_label(),
            value: formatSignedPercent(marketReturn).text,
          })}
          spread={{
            median: overview.summary.medianReturn,
            medianLabel: m.classes_map_median_label({
              value: formatSignedPercent(overview.summary.medianReturn ?? 0)
                .text,
            }),
            zeroLabel: m.classes_map_zero_label(),
            corners: [
              m.classes_map_calm_gain_label(),
              m.classes_map_wild_gain_label(),
              m.classes_map_calm_loss_label(),
              m.classes_map_wild_loss_label(),
            ],
          }}
        />
      )}
      <div className={styles["strip"]}>
        <Stat
          value={formatNumber(overview.students.length)}
          label={
            overview.students.length === 1
              ? m.classes_one_student_label()
              : m.classes_several_students_label()
          }
        />
        <Stat
          value={formatNumber(overview.active)}
          label={m.classes_active_week_label({
            share: formatPercent(
              overview.students.length === 0
                ? 0
                : overview.active / overview.students.length,
            ),
          })}
        />
        <Stat
          value={formatNumber(overview.ordersThisWeek)}
          label={
            overview.ordersThisWeek === 1
              ? m.classes_one_week_order_label()
              : m.classes_several_week_orders_label()
          }
        />
        <Stat
          value={overview.summary.medianBeta}
          label={m.classes_median_beta_label()}
        />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }): ReactNode {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function marketValues(
  marketReturn: CumulativeReturn,
  deviation: MonthlyReturn | undefined,
): MapValue[] {
  const values: MapValue[] = [
    {
      name: m.classes_map_return_label(),
      value: formatSignedPercent(marketReturn),
    },
    { name: m.classes_map_beta_label(), value: formatBeta(marketBeta) },
  ];
  if (deviation !== undefined)
    values.push({
      name: m.classes_map_deviation_label(),
      value: formatPercent(deviation),
    });
  return values;
}
