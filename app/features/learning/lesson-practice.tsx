import { practicePortfolio } from "./practice-portfolio";
import { LessonOwnNumbers } from "./lesson-own-numbers";
import { LessonUnavailablePractice } from "./lesson-unavailable-practice";
import type { ReactNode } from "react";

import type { ClassId } from "~/features/classes/classes.schema";

import { measureFailureText } from "~/features/measures/measure-failure-text";
import { formatSignedPercent } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { SessionContent } from "./content";
import { LessonAllocation } from "./lesson-allocation";
import { LessonAlpha } from "./lesson-alpha";
import { LessonCapm } from "./lesson-capm";
import { LessonExplanation } from "./lesson-explanation";
import type { LessonPracticeData } from "./lesson-practice-data";
import { PracticePanel } from "./practice-panel";
import styles from "./lesson-practice.module.css";

export function LessonPractice({
  classId,
  lesson,
  practice,
  children,
}: {
  classId: ClassId;
  lesson: SessionContent;
  practice: LessonPracticeData;
  children: ReactNode;
}): ReactNode {
  const report = practice.report;
  const own = practicePortfolio(report);
  const explanation = (
    <LessonExplanation
      lesson={lesson}
      practice={practice}
      portfolio={lesson.session === 10 ? practice.simulation : own}
    />
  );
  const ownNumbers = (
    <LessonOwnNumbers classId={classId} lesson={lesson} practice={practice} />
  );
  const unavailable = (
    <LessonUnavailablePractice
      classId={classId}
      lesson={lesson}
      practice={practice}
    />
  );
  const practiceAlpha = (
    <PracticePanel>
      <p className={styles["muted"]}>{m.learning_alpha_practice_notice()}</p>
      <LessonAlpha holdings={practice.holdings} />
      <div className={styles["task"]}>
        <p>
          <strong>{m.learning_task_label()}</strong>{" "}
          {practice.holdings.some(
            (holding) =>
              formatSignedPercent(holding.distance).direction === "fall",
          )
            ? m.learning_negative_alpha_task_notice()
            : m.learning_smallest_alpha_task_notice()}
        </p>
      </div>
    </PracticePanel>
  );
  return lesson.session === 10 && practice.simulation !== undefined ? (
    <LessonAllocation
      portfolio={practice.simulation}
      own={own}
      explanation={explanation}
    >
      {ownNumbers}
      {children}
      {own === undefined && unavailable}
    </LessonAllocation>
  ) : (
    <>
      <UnavailableLessonInteractive
        lesson={lesson}
        practice={practice}
        explanation={explanation}
      />
      {ownNumbers}
      {children}
      {lesson.session === 9 && practice.holdings.length > 0
        ? practiceAlpha
        : unavailable}
    </>
  );
}

function UnavailableLessonInteractive({
  lesson,
  practice,
  explanation,
}: {
  lesson: SessionContent;
  practice: LessonPracticeData;
  explanation: ReactNode;
}): ReactNode {
  return practice.market === undefined ? (
    <section className={styles["interactive"]}>
      <h2>
        {lesson.session === 9
          ? m.learning_capm_interactive_title()
          : m.learning_allocation_interactive_title()}
      </h2>
      <p>
        <NumberText>
          {practice.marketFailure === undefined
            ? m.learning_student_portfolio_notice()
            : measureFailureText(practice.marketFailure, {
                kind: "market",
              })}
        </NumberText>
      </p>
      {explanation}
    </section>
  ) : lesson.session === 9 ? (
    <LessonCapm practice={practice} explanation={explanation} />
  ) : (
    <section className={styles["interactive"]}>
      <h2>{m.learning_allocation_interactive_title()}</h2>
      <p>{m.learning_allocation_data_notice()}</p>
      {explanation}
    </section>
  );
}
