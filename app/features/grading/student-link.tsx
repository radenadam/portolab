import type { ComponentProps, ReactNode } from "react";
import { Link, useLinkClickHandler } from "react-router";

/** A fragment locates the panel before JavaScript loads, while enhanced navigation keeps the list at its current scroll position. */
export function StudentLink({
  to,
  ...props
}: { to: string } & Pick<
  ComponentProps<typeof Link>,
  "children" | "className" | "aria-current" | "aria-label"
>): ReactNode {
  const click = useLinkClickHandler(to.replace(/#.*$/, ""), {
    preventScrollReset: true,
  });
  return <Link {...props} to={to} onClick={click} preventScrollReset />;
}
