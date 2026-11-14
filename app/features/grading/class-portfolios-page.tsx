import type { ReactNode } from "react";
import { data } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireTaughtClass } from "~/features/classes/taught-class.server";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/class-portfolios-page";
import { ClassPortfoliosView } from "./class-portfolios-view";
import { readClassPortfolios } from "./read-class-portfolios.server";
import { readTaughtPortfolio } from "./read-taught-portfolio.server";
import { orderStudents } from "./order-students";
import { failureOf } from "~/result";
import { parseStudentSearch } from "./parse-student-search";
import { parseStudentOptions } from "./parse-student-options";
import { studentPanelData } from "./student-panel-data.server";
import { filterStudents } from "./student-filters";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.grading_students_title()) }];
}

export function loader({ context, request, params, url }: Route.LoaderArgs) {
  const taughtClass = requireTaughtClass(context, url, params.classId);
  const options = parseStudentOptions(url.searchParams, "students");
  const queryText = url.searchParams.get("q") ?? "";
  const query = parseStudentSearch(queryText, m.grading_search_label());
  if (!options.ok) throw data(null, { status: 404 });
  const viewOptions = { ...options.value, query: queryText };
  const source = readPriceSourceDescription(context);
  const now = new Date();
  const database = context.get(databaseContext);
  const portfolios = readClassPortfolios(database, taughtClass, {
    request,
    now,
    delayMinutes: source.delayMinutes,
  });
  const all = orderStudents(portfolios, options.value.measure);
  const shown = query.ok ? filterStudents(all, viewOptions) : [];
  const selected =
    options.value.studentId === undefined
      ? shown[0]
      : all.find((student) => student.studentId === options.value.studentId);
  if (options.value.studentId !== undefined && selected === undefined)
    throw data(null, { status: 404 });
  const selectedPortfolio =
    selected === undefined
      ? undefined
      : readTaughtPortfolio(context, {
          request,
          url,
          params: { ...params, studentId: String(selected.studentId) },
          now,
        });
  return data(
    {
      classId: taughtClass.id,
      all,
      quoteFailure: portfolios.quoteFailure,
      options: viewOptions,
      queryFailure: failureOf(query),
      shown,
      selected,
      panel:
        selectedPortfolio === undefined
          ? undefined
          : studentPanelData(database, selectedPortfolio),
    },
    { status: query.ok ? 200 : 400 },
  );
}

export default function ClassPortfoliosPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return <ClassPortfoliosView {...loaderData} />;
}
