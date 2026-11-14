import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChangeText } from "~/change-text";
import type { ClassId } from "~/features/classes/classes.schema";
import { stockPath } from "~/features/market-data/stock-path";
import { m } from "~/paraglide/messages.js";
import type { homeMapPoints } from "./home-map-points";
import styles from "./home-portfolio.module.css";

export function HomeMapTable({
  map,
  classId,
}: {
  map: NonNullable<ReturnType<typeof homeMapPoints>>;
  classId: ClassId;
}): ReactNode {
  return (
    <details className={styles["mapTable"]}>
      <summary>{m.trading_home_map_table_label()}</summary>
      <table className={styles["table"]}>
        <thead>
          <tr>
            <th scope="col">{m.trading_stock_label()}</th>
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
                  <Link to={stockPath(classId, point.key)}>
                    <NumberText verbatim>{point.name}</NumberText>
                  </Link>
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
