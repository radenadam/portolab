import type { ReactNode } from "react";
import { pageTitle } from "~/page-title";
import { readLearningTrade } from "~/features/trading/read-learning-trade.server";
import { readLearningPage } from "./read-learning-page.server";
import { readLearningReturnPath } from "./read-learning-return-path.server";
import { readPriceGuide } from "./read-price-guide.server";
import { PriceGuideView } from "./price-guide-view";
import type { Route } from "./+types/price-guide-page";

export function loader({ context, url, params, request }: Route.LoaderArgs) {
  const { classId } = readLearningPage(context, url, params.classId);
  return {
    classId,
    priceGuide: readPriceGuide(),
    trading: readLearningTrade(context, {
      request,
      url,
      classId: params.classId,
      now: new Date(),
    }),
    returnTo: readLearningReturnPath(url.searchParams.get("returnTo"), url),
  };
}

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: pageTitle(loaderData.priceGuide.title) }];
}

export default function PriceGuidePage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return <PriceGuideView {...loaderData} />;
}
