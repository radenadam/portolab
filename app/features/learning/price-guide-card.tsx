import type { ReactNode } from "react";
import { useLocation } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { LearningLink } from "./learning-link";
import { priceGuidePath } from "./learning-paths";
import styles from "./price-guide-card.module.css";

const cardId = "home-price-guide";

export function PriceGuideCard({
  classId,
  guide,
  className,
}: {
  classId: ClassId;
  guide: { title: string; summary: string };
  className?: string | undefined;
}): ReactNode {
  const location = useLocation();
  return (
    <LearningLink
      id={cardId}
      className={[styles["card"], className].join(" ")}
      to={priceGuidePath(
        classId,
        `${location.pathname}${location.search}#${cardId}`,
      )}
    >
      <span className={styles["badge"]}>
        {m.learning_price_guide_kind_label()}
      </span>
      <h2>
        <NumberText>{guide.title}</NumberText>
      </h2>
      <p>
        <NumberText>{guide.summary}</NumberText>
      </p>
      <span className={styles["foot"]}>
        {m.learning_price_guide_start_label()} <span aria-hidden>›</span>
      </span>
    </LearningLink>
  );
}
