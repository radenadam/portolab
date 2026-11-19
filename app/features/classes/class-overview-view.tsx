import { ClassTeachingCards } from "./class-teaching-cards";
import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import type { MarkedPoint } from "~/charts/layout-risk-map";
import type { ClassId } from "./classes.schema";
import { ClassMap } from "./class-map";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { ClassRisk, ClassMapAxis } from "./class-map";
import type { ClassOverview } from "./read-class-overview.server";
import styles from "./class-overview.module.css";

/** One portfolio load keeps the map and teaching cards consistent. */
export function ClassOverviewView({
  classId,
  overview,
  axis,
  points,
}: {
  classId: ClassId;
  overview: ClassOverview;
  axis: ClassMapAxis;
  points: readonly MarkedPoint<ClassRisk, CumulativeReturn>[];
}): ReactNode {
  return (
    <div className={styles["overview"]}>
      <div className={styles["columns"]} data-layout="columns">
        <div className={styles["main"]} data-layout="column">
          <div className={styles["heading"]}>
            {overview.pricesAt !== undefined && (
              <p className={styles["time"]}>
                <NumberText>{overview.pricesAt}</NumberText>
              </p>
            )}
            <h1>
              <NumberText>{overview.summary.headline}</NumberText>
            </h1>
            <p>
              <NumberText>{overview.summary.sentence}</NumberText>
            </p>
          </div>
          <ClassMap overview={overview} axis={axis} points={points} />
        </div>
        <ClassTeachingCards overview={overview} classId={classId} axis={axis} />
      </div>
    </div>
  );
}
