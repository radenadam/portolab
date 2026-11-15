import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import type { ClassId } from "~/features/classes/classes.schema";
import { stockPath } from "./stock-path";
import styles from "./stock-page-link.module.css";

export function StockPageLink({
  classId,
  code,
  id,
  keepReturn,
  className,
  children,
}: {
  classId: ClassId;
  code: string;
  id: string;
  keepReturn: boolean;
  className?: string | undefined;
  children: ReactNode;
}): ReactNode {
  const { pathname, search } = useLocation();
  const path = stockPath(classId, code);
  return (
    <Link
      id={id}
      className={[styles["target"], className].filter(Boolean).join(" ")}
      to={
        keepReturn ? pathReturningTo(path, `${pathname}${search}#${id}`) : path
      }
    >
      {children}
    </Link>
  );
}
