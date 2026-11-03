import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";

/** Renders a part of a page into markup inside a router, because a form of React Router needs one. */
export function renderInRouterForTest(part: ReactNode): string {
  const Stub = createRoutesStub([{ path: "/", Component: () => part }]);
  return renderToStaticMarkup(<Stub initialEntries={["/"]} />);
}
