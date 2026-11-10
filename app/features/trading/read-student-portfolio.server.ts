import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { findStudentPlace } from "./find-student-place.server";
import type { StudentPlace } from "./find-student-place.server";
import type { Portfolio } from "./portfolio-store.server";
import { readCurrentPortfolio } from "./read-current-portfolio.server";

/** What every page of the portfolio of a student reads: the class of the address with the place of the student in it, the portfolio, and what the page tells about the source of its prices. */
export interface StudentPortfolio {
  place: StudentPlace;
  portfolio: Portfolio;
  source: PriceSourceDescription;
}

/** Reads the portfolio of the student who is signed in, in the class of an address, for a page that a request loads at a moment. The url is the one that React Router gives a loader. An address that the student may not see answers as one that does not exist, as findStudentPlace explains. */
export function readStudentPortfolio(
  context: Readonly<RouterContextProvider>,
  {
    request,
    url,
    classId,
    now,
  }: { request: Request; url: URL; classId: string; now: Date },
): StudentPortfolio {
  const place = findStudentPlace(context, url, classId);
  return {
    place,
    portfolio: readCurrentPortfolio(context.get(databaseContext), place.owner, {
      request,
      now,
    }),
    source: readPriceSourceDescription(context),
  };
}
