import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { ChangeText } from "~/change-text";
import type { ClassId } from "~/features/classes/classes.schema";
import { StockPageLink } from "~/features/market-data/stock-page-link";
import { m } from "~/paraglide/messages.js";
import type { homeMapPoints } from "./home-map-points";
import styles from "./home-portfolio.module.css";

export function HomeMapTable({
  map,
  classId,
  keepReturn,
}: {
  map: NonNullable<ReturnType<typeof homeMapPoints>>;
  classId: ClassId;
  keepReturn: boolean;
}): ReactNode {
  const { hash } = useLocation();
  return (
    <details
      className={styles["mapTable"]}
      open={map.points.some((point) => hash === `#${mapStockId(point.key)}`)}
    >
      <summary>{m.trading_home_map_table_label()}</summary>
      <table className={styles["table"]}>
        <thead>
          <tr>
            <th scope="col">{m.trading_impact_point_label()}</th>
            <th scope="col">{m.trading_home_beta_label()}</th>
            <th scope="col">{m.trading_home_map_return_label()}</th>
          </tr>
        </thead>
        <tbody>
          {[
            { ...map.market, mark: { kind: "market" as const } },
            ...map.points,
          ].map((point) => (
            <tr key={point.key}>
              <th scope="row">
                {point.mark.kind === "held" ? (
                  <StockPageLink
                    classId={classId}
                    code={point.key}
                    id={mapStockId(point.key)}
                    keepReturn={keepReturn}
                  >
                    <NumberText verbatim>{point.name}</NumberText>
                  </StockPageLink>
                ) : (
                  <NumberText verbatim>{point.name}</NumberText>
                )}
              </th>
              {point.values.slice(0, 2).map(({ name, value }) => (
                <td key={name}>
                  {typeof value === "string" ? (
                    <NumberText>{value}</NumberText>
                  ) : (
                    <ChangeText change={value} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function mapStockId(code: string): string {
  return `home-map-${code}`;
}
