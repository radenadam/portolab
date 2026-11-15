import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import type { SessionNumber } from "~/features/classes/course-calendar";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { Popover, PopoverButton } from "~/popover";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import styles from "./home-portfolio.module.css";

export function HomeInsightLesson({
  session,
  lessons,
}: {
  session: SessionNumber;
  lessons: HomePortfolioData["lessons"];
}): ReactNode {
  const lesson = lessons.find((entry) => entry.session === session);
  if (lesson === undefined)
    throw new Error(
      `The insight has no key idea for session ${String(session)}.`,
    );
  const title = m.trading_home_insight_session_label({
    session: formatNumber(session),
    topic: lesson.title,
  });
  return (
    <>
      <PopoverButton
        popover="home-insight-lesson"
        className={styles["learnLink"]}
      >
        {m.trading_home_learn_label()} <span aria-hidden>→</span>
      </PopoverButton>
      <Popover id="home-insight-lesson" label={title} placement="aboveStart">
        <div className={styles["lesson"]}>
          <h2>
            <NumberText>{title}</NumberText>
          </h2>
          {lesson.paragraphs.map((paragraph) => (
            <p key={paragraph}>
              <NumberText>{paragraph}</NumberText>
            </p>
          ))}
        </div>
      </Popover>
    </>
  );
}
