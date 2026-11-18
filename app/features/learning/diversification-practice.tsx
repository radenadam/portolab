import { monthlyReturnCount } from "~/features/measures/monthly-return-count";
import type { ReactNode } from "react";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import { marketPath } from "~/features/market-data/market-path";
import { formatCorrelation, formatPercent } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { useIsInBrowser } from "~/use-is-in-browser";
import { PracticePanel } from "./practice-panel";
import { withLessonTask } from "./lesson-task";
import { LessonTaskLink } from "./lesson-task-link";
import { defaultPairWeight } from "./two-stock-allocation";
import styles from "./lesson-practice.module.css";
import localStyles from "./trading-lesson.module.css";

const listedPairs = 5;

export function DiversificationPractice({
  classId,
  own,
  chart,
  ownNumbers,
  idPrefix,
  taskPage,
}: {
  classId: ClassId;
  own: PortfolioSummary | undefined;
  /** The pair that the chart above draws, and the step that draws another, when the lesson has a pair to draw. */
  chart:
    | {
        first: string;
        second: string;
        selectPair: (first: string, second: string) => void;
      }
    | undefined;
  ownNumbers: ReactNode;
  idPrefix: string;
  taskPage: string | undefined;
}): ReactNode {
  const interactive = useIsInBrowser();
  return (
    <PracticePanel idPrefix={idPrefix}>
      {own !== undefined && own.holdings.length >= 2 && chart !== undefined ? (
        <>
          <p className={styles["muted"]}>
            <NumberText>
              {m.learning_pair_practice_notice({
                returns: monthlyReturnCount(own.market.returns.length),
              })}
            </NumberText>
          </p>
          {own.pairs
            .filter((entry) => entry.first !== entry.second)
            .toSorted(
              (firstPair, secondPair) =>
                firstPair.correlation - secondPair.correlation,
            )
            .slice(0, listedPairs)
            .map((entry) => (
              <div key={`${entry.first}-${entry.second}`}>
                {interactive ? (
                  <button
                    type="button"
                    data-learning-pair
                    className={localStyles["pair"]}
                    aria-pressed={
                      chart.first === entry.first &&
                      chart.second === entry.second
                    }
                    onClick={() => {
                      chart.selectPair(entry.first, entry.second);
                      document
                        .getElementById(`${idPrefix}lesson-interactive-title`)
                        ?.scrollIntoView({ block: "start" });
                    }}
                  >
                    <span className={styles["code"]}>
                      {entry.first} · {entry.second}
                    </span>
                    <NumberText whole>
                      ρ {formatCorrelation(entry.correlation)}
                    </NumberText>
                    <span>{m.learning_use_pair_label()}</span>
                  </button>
                ) : (
                  <p>
                    {entry.first} · {entry.second}{" "}
                    <NumberText whole>
                      ρ {formatCorrelation(entry.correlation)}
                    </NumberText>
                  </p>
                )}
              </div>
            ))}
          <div className={styles["task"]}>
            <p>
              <strong>{m.learning_task_label()}</strong>{" "}
              <NumberText>
                {m.learning_pair_task_notice({
                  weight: formatPercent(defaultPairWeight),
                })}
              </NumberText>
            </p>
          </div>
        </>
      ) : (
        <>
          {own === undefined && ownNumbers}
          <p className={styles["muted"]}>{m.learning_pair_missing_notice()}</p>
          <div className={styles["task"]}>
            <p>
              <strong>{m.learning_task_label()}</strong>{" "}
              {m.learning_pair_task_banner_notice()}
            </p>
            <LessonTaskLink
              to={withLessonTask(marketPath(classId), 2)}
              label={m.learning_find_pair_link()}
              taskPage={taskPage}
            />
          </div>
        </>
      )}
    </PracticePanel>
  );
}
