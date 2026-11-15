import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireTaughtStudent } from "~/features/classes/taught-class.server";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import type { Portfolio } from "~/features/trading/portfolio-store.server";
import { readCurrentPortfolio } from "~/features/trading/read-current-portfolio.server";
import type { Rupiah } from "~/units/rupiah";
import { parseStudentReturnPath } from "./parse-student-return-path";
import { classPortfoliosPath } from "./grading-paths";
import type { TaughtStudent } from "./taught-student-page";

/** What every page of the portfolio of one student reads for the lecturer of the class: the student, the portfolio with the starting cash of the class and the time when the student joined, from which its return counts, and what the page tells about the source of its prices. */
export interface TaughtPortfolio {
  student: TaughtStudent;
  returnPath: string;
  portfolio: Portfolio;
  startingCash: Rupiah;
  joinedAt: Date;
  source: PriceSourceDescription;
}

/** Reads the portfolio of the student of an address in a class of the lecturer who is signed in, for a page that a request loads at a moment, after a check of its open orders, as a visit of the student would check them. The url is the one that React Router gives a loader. An address that the lecturer may not see answers as one that does not exist, as requireTaughtStudent explains. */
export function readTaughtPortfolio(
  context: Readonly<RouterContextProvider>,
  {
    request,
    url,
    params,
    now,
  }: {
    request: Request;
    url: URL;
    params: { classId: string; studentId: string };
    now: Date;
  },
): TaughtPortfolio {
  const { taughtClass, student } = requireTaughtStudent(context, url, params);
  const returnPath = parseStudentReturnPath(
    url.searchParams.get("returnTo"),
    "returnTo",
    { origin: url.origin, classId: taughtClass.id },
  );
  return {
    returnPath: returnPath.ok
      ? returnPath.value
      : classPortfoliosPath(taughtClass.id),
    student: {
      classId: taughtClass.id,
      className: taughtClass.name,
      studentId: student.id,
      name: student.name,
    },
    portfolio: readCurrentPortfolio(
      context.get(databaseContext),
      {
        kind: "membership" as const,
        membershipId: student.membershipId,
        startingCash: taughtClass.startingCash,
      },
      { request, now },
    ),
    startingCash: taughtClass.startingCash,
    joinedAt: student.joinedAt,
    source: readPriceSourceDescription(context),
  };
}
