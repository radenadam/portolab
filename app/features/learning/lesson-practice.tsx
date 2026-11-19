import { practicePortfolio } from "./practice-portfolio";
import { LessonOwnNumbers } from "./lesson-own-numbers";
import { LessonUnavailablePractice } from "./lesson-unavailable-practice";
import type { ReactNode } from "react";

import { formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { LessonAllocation } from "./lesson-allocation";
import { LessonAlpha } from "./lesson-alpha";
import { LessonCapm } from "./lesson-capm";
import { LessonExplanation } from "./lesson-explanation";
import type {
  LessonPracticeData,
  LessonPracticeProps,
} from "./lesson-practice-data";
import { lessonActivityOf } from "./lesson-practice-sessions";
import { PracticePanel } from "./practice-panel";
import styles from "./lesson-practice.module.css";
import { LessonDiversification } from "./lesson-diversification";

export function LessonPractice(props: LessonPracticeProps): ReactNode {
  const activity = lessonActivityOf(props.lesson.session);
  switch (activity) {
    case "diversification":
      return <LessonDiversification {...props} />;
    case "capm":
    case "allocation":
      return <AdvancedLessonPractice {...props} activity={activity} />;
    case "trading":
    case undefined:
      throw new Error(
        `Session ${String(props.lesson.session)} has no practice with measures.`,
      );
  }
}

function AdvancedLessonPractice({
  classId,
  lesson,
  activity,
  practice,
  children,
  idPrefix = "",
  taskPage,
}: LessonPracticeProps & { activity: "capm" | "allocation" }): ReactNode {
  const report = practice.report;
  const own = practicePortfolio(report);
  const explanation = (
    <LessonExplanation
      lesson={lesson}
      activity={activity}
      practice={practice}
      portfolio={activity === "allocation" ? practice.simulation : own}
    />
  );
  const ownNumbers = (
    <LessonOwnNumbers
      classId={classId}
      activity={activity}
      practice={practice}
    />
  );
  const unavailable = (
    <LessonUnavailablePractice
      classId={classId}
      lesson={lesson}
      practice={practice}
      idPrefix={idPrefix}
      taskPage={taskPage}
    >
      {ownNumbers}
    </LessonUnavailablePractice>
  );
  const practiceAlpha = (
    <PracticePanel idPrefix={idPrefix}>
      <p className={styles["muted"]}>{m.learning_alpha_practice_notice()}</p>
      <LessonAlpha holdings={practice.holdings} idPrefix={idPrefix} />
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
  return activity === "allocation" && practice.simulation !== undefined ? (
    <LessonAllocation
      portfolio={practice.simulation}
      own={own}
      explanation={explanation}
      idPrefix={idPrefix}
    >
      {own !== undefined && ownNumbers}
      {children}
      {own === undefined && unavailable}
    </LessonAllocation>
  ) : (
    <>
      <UnavailableLessonInteractive
        activity={activity}
        practice={practice}
        explanation={explanation}
        idPrefix={idPrefix}
      />
      {own !== undefined && ownNumbers}
      {children}
      {activity === "capm" && practice.holdings.length > 0
        ? practiceAlpha
        : unavailable}
    </>
  );
}

const unavailableTitles: Record<"capm" | "allocation", () => string> = {
  capm: m.learning_capm_interactive_title,
  allocation: m.learning_allocation_interactive_title,
};

function UnavailableLessonInteractive({
  activity,
  practice,
  explanation,
  idPrefix,
}: {
  activity: "capm" | "allocation";
  practice: LessonPracticeData;
  explanation: ReactNode;
  idPrefix: string;
}): ReactNode {
  return activity === "capm" && practice.market !== undefined ? (
    <LessonCapm
      practice={practice}
      explanation={explanation}
      idPrefix={idPrefix}
    />
  ) : (
    <section className={styles["interactive"]}>
      <h2>
        {unavailableTitles[activity]()}
        {explanation}
      </h2>
      <p>{m.learning_interactive_data_notice()}</p>
    </section>
  );
}
