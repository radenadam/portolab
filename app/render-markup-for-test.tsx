import type { ReactNode } from "react";
import { renderInRouterForTest } from "./render-in-router-for-test";
import { withoutClassNamesForTest } from "./without-class-names-for-test";

/** Renders a part of a page inside a router into markup without its class names, which a test reads whole. */
export function renderMarkupForTest(
  part: ReactNode,
  rootData?: unknown,
): string {
  return withoutClassNamesForTest(renderInRouterForTest(part, rootData));
}
