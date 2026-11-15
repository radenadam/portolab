import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import { createPortal } from "react-dom";
import { LearningSheet } from "./learning-sheet";

interface OpenSheet {
  opener: HTMLAnchorElement;
  popover: HTMLElement | null;
  host: Element;
  address: string;
}

export default function LearningOverlay(): ReactNode {
  const location = useLocation();
  const [previousLocation, setPreviousLocation] = useState(location);
  const [sheets, setSheets] = useState<OpenSheet[]>([]);
  const hasSheets = sheets.length > 0;
  useEffect(() => {
    if (!hasSheets) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [hasSheets]);
  useEffect(() => {
    function open(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      )
        return;
      const opener = event.target.closest<HTMLAnchorElement>(
        "a[data-learning-sheet]",
      );
      if (
        opener === null ||
        opener.target === "_blank" ||
        opener.hasAttribute("download")
      )
        return;
      event.preventDefault();
      setSheets((previous) => [
        ...previous,
        {
          opener,
          popover: opener.closest<HTMLElement>("[popover]"),
          host: opener.closest("dialog") ?? document.body,
          address: `${opener.pathname}${opener.search}${opener.hash}`,
        },
      ]);
    }
    document.addEventListener("click", open);
    return () => {
      document.removeEventListener("click", open);
    };
  }, []);
  if (previousLocation !== location) {
    setPreviousLocation(location);
    setSheets([]);
  }
  return (
    <>
      <Outlet />
      {sheets.map((sheet, index) =>
        createPortal(
          <LearningSheet
            address={sheet.address}
            onClose={() => {
              setSheets((previous) => previous.slice(0, index));
              const popover =
                sheet.popover === null || sheet.popover.isConnected
                  ? sheet.popover
                  : [
                      ...sheet.host.querySelectorAll<HTMLElement>("[popover]"),
                    ].find(
                      (candidate) =>
                        candidate.getAttribute("aria-label") ===
                        sheet.popover?.getAttribute("aria-label"),
                    );
              if (popover !== undefined && popover !== null) {
                const trigger = [
                  ...sheet.host.querySelectorAll<HTMLButtonElement>(
                    "[popovertarget]",
                  ),
                ].find((button) => button.popoverTargetElement === popover);
                trigger?.focus({ preventScroll: true });
                popover.showPopover();
              }
              const opener = sheet.opener.isConnected
                ? sheet.opener
                : [
                    ...(
                      popover ?? sheet.host
                    ).querySelectorAll<HTMLAnchorElement>(
                      "a[data-learning-sheet]",
                    ),
                  ].find((candidate) => candidate.href === sheet.opener.href);
              opener?.focus({ preventScroll: true });
            }}
          />,
          sheet.host,
          String(index),
        ),
      )}
    </>
  );
}
