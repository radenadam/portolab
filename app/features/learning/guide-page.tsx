import type { ReactNode } from "react";
import { requireRole } from "~/features/accounts/current-session.server";
import { pageTitle } from "~/page-title";
import { getLocale } from "~/paraglide/runtime.js";
import type { Route } from "./+types/guide-page";
import { GuideView } from "./guide-view";
import { readGuideContent } from "./read-guide-content.server";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: pageTitle(loaderData.guide.title) }];
}

export function loader({ context, url }: Route.LoaderArgs) {
  requireRole(context, url, "lecturer");
  const content = readGuideContent();
  if (!content.ok) throw new Error(content.failure);
  const guide = content.value.find((entry) => entry.locale === getLocale());
  if (guide === undefined)
    throw new Error("The parsed guide has no active language.");
  return { guide };
}

export default function GuidePage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return <GuideView guide={loaderData.guide} />;
}
