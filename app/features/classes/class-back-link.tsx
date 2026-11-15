import type { ReactNode } from "react";
import { Link } from "react-router";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { ClassId } from "./classes.schema";
import { classPath } from "./class-path";
import styles from "./classes.module.css";

export function ClassBackLink({
  classId,
  className,
}: {
  classId: ClassId;
  className: string;
}): ReactNode {
  return (
    <Link to={classPath(classId)} className={styles["link"]}>
      <NumberText verbatim>
        {m.classes_back_link({ class: className })}
      </NumberText>
    </Link>
  );
}
