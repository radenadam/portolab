import { readAnalysisPage } from "./read-analysis-page.server";
import type { Route } from "./+types/demonstration-analysis-page";

export { default } from "./measures-page";

export function loader(args: Route.LoaderArgs) {
  return readAnalysisPage({ ...args, now: new Date() }, "demonstration");
}
