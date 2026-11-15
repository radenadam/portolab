import type { ReactNode } from "react";
import { Link } from "react-router";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import styles from "./classes.module.css";

export function ClassBackLink({
  className,
  to,
}: {
  className: string;
  to: string;
}): ReactNode {
  return (
    <Link to={to} className={styles["link"]}>
      <NumberText verbatim>
        {m.classes_back_link({ class: className })}
      </NumberText>
    </Link>
  );
}
