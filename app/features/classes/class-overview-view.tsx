import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChangeText } from "~/change-text";
import { NumberText } from "~/number-text";
import { studentPortfolioPath } from "~/features/grading/grading-paths";
import { formatBeta, formatPercent, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { MarkedPoint } from "~/charts/layout-risk-map";
import type { ClassId } from "./classes.schema";
import { ClassMap } from "./class-map";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { ClassRisk, ClassMapAxis } from "./class-map";
import type { ClassOverview } from "./read-class-overview.server";
import styles from "./class-overview.module.css";

/** The lecturer's class overview. It fills the available column until the teaching cards of piece 29 have content. */
export function ClassOverviewView({
  classId,
  overview,
  axis,
  points,
  administration,
}: {
  classId: ClassId;
  overview: ClassOverview;
  axis: ClassMapAxis;
  points: readonly MarkedPoint<ClassRisk, CumulativeReturn>[];
  administration: ReactNode;
}): ReactNode {
  return (
    <div className={styles["overview"]}>
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
      {overview.quoteFailure !== undefined && (
        <p>
          <NumberText>{overview.quoteFailure}</NumberText>
        </p>
      )}
      <details className={styles["data"]}>
        <summary>{m.classes_map_table_label()}</summary>
        <div className={styles["tableFrame"]}>
          <table className={styles["table"]}>
            <thead>
              <tr>
                <th>{m.classes_students_title()}</th>
                <th>{m.classes_map_return_label()}</th>
                <th>{m.classes_map_risk_label()}</th>
                <th>{m.classes_map_last_order_label()}</th>
                <th>{m.classes_map_prices_label()}</th>
              </tr>
            </thead>
            <tbody>
              {overview.students.map((student) => (
                <tr key={student.id}>
                  <th scope="row">
                    <Link to={studentPortfolioPath(classId, student.id)}>
                      <NumberText>{student.name}</NumberText>
                    </Link>
                  </th>
                  <td data-label={m.classes_map_return_label()}>
                    {student.return === undefined ? (
                      m.classes_measure_pending_label()
                    ) : (
                      <NumberText whole>
                        <ChangeText
                          change={formatSignedPercent(student.return)}
                          colored
                        />
                      </NumberText>
                    )}
                  </td>
                  <td data-label={m.classes_map_risk_label()}>
                    {student.risk === undefined ? (
                      <NumberText>{student.reason}</NumberText>
                    ) : (
                      <>
                        {m.classes_map_beta_label()}{" "}
                        <NumberText whole>
                          {formatBeta(student.risk.beta)}
                        </NumberText>
                        <br />
                        {m.classes_map_deviation_label()}{" "}
                        <NumberText whole>
                          {formatPercent(student.risk.standardDeviation)}
                        </NumberText>
                      </>
                    )}
                  </td>
                  <td data-label={m.classes_map_last_order_label()}>
                    <NumberText>{student.lastOrder}</NumberText>
                  </td>
                  <td data-label={m.classes_map_prices_label()}>
                    <NumberText>{student.priceTimes}</NumberText>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <details className={styles["administration"]} data-class-administration>
        <summary>{m.classes_administration_label()}</summary>
        {administration}
      </details>
    </div>
  );
}
