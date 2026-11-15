import type { ReactNode } from "react";

/** Native links keep the return path usable while the class layout loads its sheet enhancement. */
export function LearningLink({
  to,
  className,
  children,
}: {
  to: string;
  className?: string | undefined;
  children: ReactNode;
}): ReactNode {
  return (
    <a href={to} className={className} data-learning-sheet>
      {children}
    </a>
  );
}
