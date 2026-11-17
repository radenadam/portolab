import { weightedHoldingRisk } from "~/features/measures/weighted-holding-risk";
import { diversificationNumbers } from "./diversification-numbers";
import { monthlyReturnCount } from "~/features/measures/monthly-return-count";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import { marketPath } from "~/features/market-data/market-path";
import { formatCorrelation, formatPercent } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { useIsInBrowser } from "~/use-is-in-browser";
import { PracticePanel } from "./practice-panel";
import { withLessonTask } from "./lesson-task";
import { defaultPairWeight } from "./two-stock-allocation";
import styles from "./lesson-practice.module.css";
import localStyles from "./trading-lesson.module.css";
export function DiversificationPractice({
  classId,
  own,
  first,
  second,
  selectPair,
  idPrefix,
  taskPage,
  missingNumbers,
}: {
  classId: ClassId;
  own: PortfolioSummary | undefined;
  first: string;
  second: string;
  selectPair: (first: string, second: string) => void;
  idPrefix: string;
  taskPage: string | undefined;
  missingNumbers: ReactNode;
}): ReactNode {
  const interactive = useIsInBrowser();
  return (
    <PracticePanel idPrefix={idPrefix}>
      {own !== undefined && own.holdings.length >= 2 ? (
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
            .slice(0, 5)
            .map((entry) => (
              <div key={`${entry.first}-${entry.second}`}>
                {interactive ? (
                  <button
                    type="button"
                    data-learning-pair
                    className={localStyles["pair"]}
                    aria-pressed={
                      first === entry.first && second === entry.second
                    }
                    onClick={() => {
                      selectPair(entry.first, entry.second);
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
          {own === undefined && missingNumbers}
          <p>{m.learning_pair_missing_notice()}</p>
          <Link
            className={styles["button"]}
            to={taskPage ?? withLessonTask(marketPath(classId), 2)}
          >
            {taskPage === undefined
              ? m.learning_find_pair_link()
              : m.learning_open_practice_link()}
          </Link>
        </>
      )}
    </PracticePanel>
  );
}
export function DiversificationOwnNumbers({
  own,
}: {
  own: PortfolioSummary | undefined;
}): ReactNode {
  return (
    <>
      {" "}
      {own !== undefined && (
        <section className={styles["yours"]}>
          <strong>{m.learning_your_numbers_label()}</strong>
          <p>
            <NumberText>
              {diversificationNumbers({
                average: weightedHoldingRisk(own),
                risk: own.standardDeviation,
              })}
            </NumberText>
          </p>
          <p className={styles["provenance"]}>
            {m.learning_price_times_notice()}
          </p>
        </section>
      )}
    </>
  );
}
