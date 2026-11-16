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
  returnHint,
  className,
  children,
}: {
  classId: ClassId;
  code: string;
  id: string;
  keepReturn: boolean;
  returnHint?: { parameter: string; value: string } | undefined;
  className?: string | undefined;
  children: ReactNode;
}): ReactNode {
  const { pathname, search } = useLocation();
  const path = stockPath(classId, code);
  let returnSearch = search;
  if (returnHint !== undefined) {
    const query = new URLSearchParams(search);
    query.set(returnHint.parameter, returnHint.value);
    returnSearch = `?${query.toString()}`;
  }
  return (
    <Link
      id={id}
      className={[styles["target"], className].filter(Boolean).join(" ")}
      to={
        keepReturn
          ? pathReturningTo(path, `${pathname}${returnSearch}#${id}`)
          : path
      }
    >
      {children}
    </Link>
  );
}
