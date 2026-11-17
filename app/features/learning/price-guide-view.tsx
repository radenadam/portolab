import { learningPriceSourceText } from "./learning-price-source-text";
import {
  PriceGuideMark,
  PriceGuideExample,
  PriceGuideCost,
} from "./price-guide-example";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketPath } from "~/features/market-data/market-path";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { PriceGuideContent } from "./parse-price-guide";
import type { TradingLessonData } from "./trading-lesson-data";
import { learnPath, priceGuidePath } from "./learning-paths";
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
      <header className={styles["hero"]}>
        {!inSheet && (
          <Link className={styles["link"]} to={returnTo ?? learnPath(classId)}>
            <span aria-hidden="true">‹</span>
            {returnTo === undefined
              ? m.learning_back_link()
              : m.learning_return_link()}
          </Link>
        )}
        <div className={styles["sheetTools"]}>
          <span className={styles["badge"]}>
            {m.learning_price_guide_badge_label()}
          </span>
          {inSheet && (
            <Link
              className={styles["link"]}
              to={priceGuidePath(classId, returnTo)}
            >
              {m.learning_open_lesson_link()}
            </Link>
          )}
        </div>
        {!inSheet && <h1>{priceGuide.title}</h1>}
      </header>
      <p className={styles["keyIdea"]}>{priceGuide.sections["key-idea"]}</p>
      <section
        className={practiceStyles["interactive"]}
        aria-label={m.learning_price_example_label()}
      >
        <PriceGuideExample trading={trading} />
        <ol className={localStyles["marks"]}>
          {(
            [
              [m.learning_code_label(), priceGuide.sections.code],
              [m.learning_last_price_label(), priceGuide.sections.price],
              [m.learning_change_label(), priceGuide.sections.change],
              [m.learning_quote_time_label(), priceGuide.sections.time],
            ] as const
          ).map(([label, paragraph], index) => (
            <li key={label}>
              <PriceGuideMark number={index + 1} />
              <div>
                <strong>{label}</strong>
                <p>{paragraph}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className={practiceStyles["muted"]}>
          <NumberText>{learningPriceSourceText(trading.source)}</NumberText>
        </p>
      </section>
      <PriceGuideCost trading={trading} />
      <PracticePanel idPrefix={idPrefix}>
        <p>{m.learning_price_guide_task_notice()}</p>
        <Link
          className={practiceStyles["button"]}
          to={
            inSheet
              ? `${priceGuidePath(classId, returnTo)}#practice`
              : withLessonTask(marketPath(classId), "prices")
          }
        >
          {inSheet
            ? m.learning_open_practice_link()
            : m.learning_read_stock_link()}
        </Link>
      </PracticePanel>
    </article>
  );
}
