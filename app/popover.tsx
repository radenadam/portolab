import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import styles from "./popover.module.css";

/** Where a popover opens beside the button that opens it: under it or above it, from its start toward the end of the line, or from its end toward the start. */
export type PopoverPlacement = "belowStart" | "belowEnd" | "aboveStart";

// A button and its popover find each other by a name of CSS that the id of the popover gives, so a page can hold several popovers.
function anchorName(popoverId: string): string {
  return `--${popoverId}`;
}

/**
 * A part that opens in place over the screen, such as a menu or a card, which the browser opens from a PopoverButton before JavaScript loads. A tap outside it or Escape closes it, and so does a new page, because the frame stays on the screen while the page changes.
 *
 * A browser that cannot place it beside its button shows it in the middle of the screen.
 */
export function Popover({
  id,
  label,
  placement,
  children,
}: {
  id: string;
  /** The name of the popover, which a screen reader reads when it opens. */
  label: string;
  placement: PopoverPlacement;
  children: ReactNode;
}): ReactNode {
  const popoverRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const previousLocationRef = useRef(location);
  useEffect(() => {
    if (
      previousLocationRef.current !== location &&
      popoverRef.current?.matches(":popover-open") === true
    ) {
      popoverRef.current.hidePopover();
    }
    previousLocationRef.current = location;
  }, [location]);
  return (
    <div
      ref={popoverRef}
      id={id}
      popover="auto"
      role="dialog"
      aria-label={label}
      className={[styles["popover"], styles[placement]].join(" ")}
      style={{ positionAnchor: anchorName(id) }}
    >
      {children}
    </div>
  );
}

/** The button that opens and closes a popover, beside which the popover opens. Several buttons may open one popover when only one of them shows on a screen, such as one on a phone and one on a desktop. */
export function PopoverButton({
  popover,
  label,
  className,
  children,
}: {
  /** The id of the popover. */
  popover: string;
  /** The name of the button when its content does not say what it opens, such as initials. */
  label?: string | undefined;
  className: string | undefined;
  children: ReactNode;
}): ReactNode {
  return (
    <button
      type="button"
      popoverTarget={popover}
      aria-label={label}
      className={className}
      style={{ anchorName: anchorName(popover) }}
    >
      {children}
    </button>
  );
}
