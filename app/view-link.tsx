import type { ComponentProps, ReactNode } from "react";
import { Link, useLinkClickHandler } from "react-router";

/** A link that changes how a screen shows its data, such as the axis of a map. Before JavaScript loads, its fragment brings the reader back to the part that changed. Once the app runs, it replaces the address without the fragment and keeps the scroll position, so the part changes in place instead of the page jumping. */
export function ViewLink({
  to,
  ...props
}: { to: string } & Pick<
  ComponentProps<typeof Link>,
  "children" | "className" | "aria-current" | "aria-label"
>): ReactNode {
  const click = useLinkClickHandler(to.replace(/#.*$/, ""), {
    preventScrollReset: true,
    replace: true,
  });
  return <Link {...props} to={to} onClick={click} preventScrollReset />;
}
