import type { ReactNode } from "react";
import styles from "./learning-link.module.css";

/** Native links keep the return path usable while the class layout loads its sheet enhancement. */
export function LearningLink({
  to,
  id,
  className,
  children,
}: {
  to: string;
  id?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}): ReactNode {
  return (
    <a
      id={id}
      href={to}
      className={[className, styles["source"]].join(" ")}
      data-learning-sheet
    >
      {children}
    </a>
  );
}
