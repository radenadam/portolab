import type { ReactNode } from "react";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { createRoutesStub } from "react-router";

/** Renders a part of a page into markup inside a router, because a form of React Router needs one. */
export function renderInRouterForTest(
  part: ReactNode,
  rootData?: unknown,
): string {
  const Stub = createRoutesStub([
    { id: "root", path: "/", Component: () => part },
  ]);
  return renderTextMarkupForTest(
    <Stub
      initialEntries={["/"]}
      hydrationData={{ loaderData: { root: rootData } }}
    />,
  );
}
