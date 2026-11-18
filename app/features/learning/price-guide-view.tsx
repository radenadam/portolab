import { learningPriceSourceText } from "./learning-price-source-text";
import {
  PriceGuideMark,
  PriceGuideExample,
  PriceGuideCost,
} from "./price-guide-example";
import type { ReactNode } from "react";
import { LessonTaskLink } from "./lesson-task-link";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketPath } from "~/features/market-data/market-path";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { PriceGuideContent } from "./parse-price-guide";
import type { TradingLessonData } from "./trading-lesson-data";
import { priceGuidePath } from "./learning-paths";
import { LessonHeader } from "./lesson-header";
import { PracticePanel } from "./practice-panel";
import { withLessonTask } from "./lesson-task";
import styles from "./learning.module.css";
import practiceStyles from "./lesson-practice.module.css";
import localStyles from "./trading-lesson.module.css";

export function PriceGuideView({
  classId,
  priceGuide,
  trading,
  returnTo,
  inSheet = false,
  idPrefix = "",
}: {
  classId: ClassId;
  priceGuide: PriceGuideContent;
  trading: TradingLessonData;
  returnTo: string | undefined;
  inSheet?: boolean;
  idPrefix?: string;
}): ReactNode {
  return (
    <article className={styles["reading"]} data-layout="reading">
      <LessonHeader
        classId={classId}
        badge={m.learning_price_guide_badge_label()}
        title={priceGuide.title}
        page={priceGuidePath(classId, returnTo)}
        returnTo={returnTo}
        inSheet={inSheet}
        idPrefix={idPrefix}
        hasPractice={false}
      />
      <p className={styles["keyIdea"]}>{priceGuide.sections["key-idea"]}</p>
      <section
        className={practiceStyles["interactive"]}
        aria-label={m.learning_price_example_label()}
      >
        <PriceGuideExample trading={trading} />
        <ol className={localStyles["marks"]}>
          {(
            [
              [m.learning_code_label(), priceGuide.sections.code, null],
              [
                m.learning_last_price_label(),
                priceGuide.sections.price,
                <NumberText key="source">
                  {learningPriceSourceText(trading.source)}
                </NumberText>,
              ],
              [m.learning_change_label(), priceGuide.sections.change, null],
              [m.learning_quote_time_label(), priceGuide.sections.time, null],
            ] as const
          ).map(([label, paragraph, source], index) => (
            <li key={label}>
              <PriceGuideMark number={index + 1} />
              <div>
                <strong>{label}</strong>
                <p>
                  {source === null ? (
                    paragraph
                  ) : (
                    <>
                      {paragraph} {source}
                    </>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <PriceGuideCost trading={trading} />
      <PracticePanel
        idPrefix={idPrefix}
        title={m.learning_guide_practice_title()}
      >
        <div className={practiceStyles["task"]}>
          <p>
            <strong>{m.learning_task_label()}</strong>{" "}
            {m.learning_price_guide_task_notice()}
          </p>
          <LessonTaskLink
            to={withLessonTask(marketPath(classId), "prices")}
            label={m.learning_read_stock_link()}
            taskPage={
              inSheet
                ? `${priceGuidePath(classId, returnTo)}#practice`
                : undefined
            }
          />
        </div>
      </PracticePanel>
    </article>
  );
}
