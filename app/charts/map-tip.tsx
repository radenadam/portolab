import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import type { MapValue } from "./layout-risk-map";
import type { DrawnPoint } from "./map-drawing";
import { tipAcross, tipDown } from "./tip-placement";
import styles from "./risk-map.module.css";

export function MapTip({ drawn }: { drawn: DrawnPoint }): ReactNode {
  return (
    <div
      className={styles["tip"]}
      style={{
        ...tipAcross(drawn.placed.position.x),
        ...tipDown(drawn.placed.position.y),
      }}
    >
      <p className={styles["tipName"]}>
        <NumberText verbatim>{drawn.point.name}</NumberText>
      </p>
      {drawn.point.values.map(({ name, value }) => (
        <p key={name} className={styles["tipValue"]}>
          <span>
            <NumberText verbatim>{name}</NumberText>
          </span>
          <span className={styles["tipNumber"]}>
            <NumberText whole>
              <ValueText value={value} />
            </NumberText>
          </span>
        </p>
      ))}
    </div>
  );
}

function ValueText({ value }: { value: MapValue["value"] }): ReactNode {
  return typeof value === "string" ? value : <ChangeText change={value} />;
}
