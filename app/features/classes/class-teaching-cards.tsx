import type { ClassFlag } from "./class-teaching";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { initialsOf } from "~/initials-of";
import { NumberText } from "~/number-text";
import { Popover, PopoverButton } from "~/popover";
import { formatNumber } from "~/formatting";
import { lessonPath } from "~/features/learning/learning-paths";
import { LearningLink } from "~/features/learning/learning-link";
import { m } from "~/paraglide/messages.js";
import type { ClassId } from "./classes.schema";
import type { ClassMapAxis } from "./class-map";
import { classMapPath } from "./class-path";
import type { ClassOverview } from "./read-class-overview.server";
import styles from "./class-teaching-cards.module.css";

const flagPaths: Record<ClassFlag["tone"], string> = {
  loss: "M3 7l6 6 4-4 8 8M15 17h6v-6",
  idle: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
};

const allReasonsId = "class-all-reasons";
const recentReasonCount = 2;

export function ClassTeachingCards({
  overview,
  classId,
  axis,
}: {
  overview: Pick<ClassOverview, "flags" | "discussion" | "reasons"> & {
    students: readonly Pick<ClassOverview["students"][number], "id" | "name">[];
  };
  classId: ClassId;
  axis: ClassMapAxis;
}): ReactNode {
  const discussion = overview.discussion;
  return (
    <aside className={styles["cards"]} data-layout="column">
      <section className={styles["card"]} aria-labelledby="class-flags">
        <h2 id="class-flags">{m.classes_flags_title()}</h2>
        {overview.flags.length === 0 ? (
          <p>{m.classes_flags_empty_notice()}</p>
        ) : (
          overview.flags.map((flag) => (
            <Link key={flag.key} to={flag.href} className={styles["flag"]}>
              <span className={styles[flag.tone]} aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={flagPaths[flag.tone]} />
                </svg>
              </span>
              <span>
                <strong>
                  {flag.group ? (
                    <NumberText whole>{flag.name}</NumberText>
                  ) : (
                    <NumberText verbatim>{flag.name}</NumberText>
                  )}
                </strong>
                <span className={styles["flagText"]}>
                  <NumberText>{flag.text}</NumberText>
                </span>
              </span>
              <CardArrow kind="next" />
            </Link>
          ))
        )}
      </section>
      <section
        id="class-discussion"
        className={styles["card"]}
        aria-labelledby="class-discussion-heading"
      >
        <h2 id="class-discussion-heading">
          {m.classes_discussion_title()}
          {discussion.badge !== undefined && (
            <span className={styles["badge"]}>
              <NumberText>{discussion.badge}</NumberText>
            </span>
          )}
        </h2>
        {discussion.notice !== undefined && (
          <p>
            <NumberText>{discussion.notice}</NumberText>
          </p>
        )}
        {discussion.questions.length > 0 && (
          <ul className={styles["questions"]}>
            {discussion.questions.map((question) => (
              <li key={question}>
                <NumberText>
                  {(textValue) => {
                    let text = question;
                    for (const student of overview.students)
                      text = text
                        .split(`\u0000${String(student.id)}\u0000`)
                        .join(textValue(student.name));
                    return text;
                  }}
                </NumberText>
              </li>
            ))}
          </ul>
        )}
        {discussion.lesson !== undefined && (
          <LearningLink
            className={styles["link"]}
            to={lessonPath(
              classId,
              discussion.lesson,
              `${classMapPath(classId, axis)}#class-discussion`,
            )}
          >
            <NumberText>
              {m.classes_discussion_lesson_link({
                session: formatNumber(discussion.lesson),
              })}
            </NumberText>
            <CardArrow kind="lesson" />
          </LearningLink>
        )}
      </section>
      <section
        id="class-reasons"
        className={styles["card"]}
        aria-labelledby="class-reasons-heading"
      >
        <div className={styles["heading"]}>
          <h2 id="class-reasons-heading">{m.classes_reasons_title()}</h2>
          {overview.reasons.length > recentReasonCount && (
            <PopoverButton popover={allReasonsId} className={styles["link"]}>
              {m.classes_reasons_all_label()}
              <CardArrow kind="next" />
            </PopoverButton>
          )}
        </div>
        {overview.reasons.length === 0 ? (
          <p>{m.classes_reasons_empty_notice()}</p>
        ) : (
          <Reasons reasons={overview.reasons.slice(0, recentReasonCount)} />
        )}
        {overview.reasons.length > recentReasonCount && (
          <Popover
            id={allReasonsId}
            label={m.classes_reasons_title()}
            placement="aboveStart"
            className={styles["sheet"]}
          >
            <div className={styles["heading"]}>
              <h2>{m.classes_reasons_title()}</h2>
              <button
                type="button"
                popoverTarget={allReasonsId}
                popoverTargetAction="hide"
                className={styles["link"]}
              >
                {m.classes_reasons_close_label()}
              </button>
            </div>
            <Reasons reasons={overview.reasons} />
          </Popover>
        )}
      </section>
    </aside>
  );
}

function Reasons({
  reasons,
}: {
  reasons: ClassOverview["reasons"];
}): ReactNode {
  return (
    <div>
      {reasons.map((reason) => (
        <Link key={reason.key} to={reason.href} className={styles["reason"]}>
          <span
            className={styles["avatar"]}
            data-initials={initialsOf(reason.name)}
            aria-hidden="true"
          />
          <span>
            <strong>
              <NumberText verbatim>{reason.name}</NumberText>
            </strong>{" "}
            <small>
              <NumberText>{reason.heading}</NumberText>
            </small>
            <q className={styles["quote"]}>
              <NumberText verbatim>{reason.reason}</NumberText>
            </q>
          </span>
        </Link>
      ))}
    </div>
  );
}

function CardArrow({ kind }: { kind: "next" | "lesson" }): ReactNode {
  const paths = {
    next: "m9 6 6 6-6 6",
    lesson: "M5 12h14M12 5l7 7-7 7",
  };
  return (
    <svg
      className={styles["chevron"]}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  );
}
