import type { ReactNode } from "react";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/measures-page";
import { AnalysisView } from "./analysis-view";
import { AnalysisAxisForm } from "./analysis-axis-form";
import { readAnalysisPage } from "./read-analysis-page.server";
export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.measures_analysis_title()) }];
}

export function loader(args: Route.LoaderArgs) {
  return readAnalysisPage({ ...args, now: new Date() }, "membership");
}

export default function MeasuresPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  if (loaderData.kind === "axisFailure") {
    return <AnalysisAxisForm {...loaderData} />;
  }
  return <AnalysisView {...loaderData} />;
}
