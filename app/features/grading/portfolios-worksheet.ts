import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatMarketTime, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { headingCell, numberCell, textCell } from "~/workbook/workbook-cells";
import type { NumberFormat, WorkbookCell } from "~/workbook/workbook-cells";
import type { Worksheet } from "~/workbook/write-workbook.server";
import type {
  ClassPortfolios,
  RankedStudent,
  UnmeasuredStudent,
} from "./read-class-portfolios.server";

import type { ComparedMeasures } from "./compared-measures";
import { orderStudents } from "./order-students";
import { rankingLabel } from "./ranking-measure";
import type { RankingMeasure } from "./ranking-measure";

type Student = RankedStudent | UnmeasuredStudent;

/** A column of the worksheet: its heading, its width in characters, and the cell of each student, which is undefined when the column has nothing for the student. */
interface Column {
  heading: () => string;
  width: number;
  cell: (student: Student) => WorkbookCell | undefined;
}

// A name and a reason are the longest texts, so their columns are the widest. A spreadsheet shows a longer text over the empty cells beside it or cuts it at the next cell, and the reader can widen a column.
const nameWidth = 30;
const usernameWidth = 24;
const numberWidth = 16;
const reasonWidth = 80;

function measure(
  name: Exclude<keyof ComparedMeasures, "sharpe" | "treynor" | "riskFreeRate">,
  format: NumberFormat,
): (student: Student) => WorkbookCell | undefined {
  return (student) =>
    "measures" in student
      ? numberCell(student.measures[name], format)
      : undefined;
}

// The username distinguishes students of the same name, and reasons keep unavailable measures from looking like zero.
const columns: readonly Column[] = [
  {
    heading: () => m.grading_name_label(),
    width: nameWidth,
    cell: (student) => textCell(student.name),
  },
  {
    heading: () => m.grading_username_label(),
    width: usernameWidth,
    cell: (student) => textCell(student.username),
  },
  {
    heading: () => m.grading_market_line_label(),
    width: numberWidth,
    cell: measure("distance", "percent"),
  },
  {
    heading: () => m.grading_sharpe_label(),
    width: numberWidth,
    cell: (student) =>
      "measures" in student && student.measures.sharpe.ok
        ? numberCell(student.measures.sharpe.value, "twoDecimals")
        : undefined,
  },
  {
    heading: () => m.grading_treynor_label(),
    width: numberWidth,
    cell: (student) =>
      "measures" in student && student.measures.treynor.ok
        ? numberCell(student.measures.treynor.value, "percent")
        : undefined,
  },
  {
    heading: () => m.grading_expected_return_label(),
    width: numberWidth,
    cell: measure("expectedReturn", "percent"),
  },
  {
    heading: () => m.grading_standard_deviation_label(),
    width: numberWidth,
    cell: measure("standardDeviation", "percent"),
  },
  {
    heading: () => m.grading_beta_label({ index: marketIndex.code }),
    width: numberWidth,
    cell: measure("beta", "twoDecimals"),
  },
  {
    heading: () => m.grading_required_return_label(),
    width: numberWidth,
    cell: measure("requiredReturn", "percent"),
  },
  {
    heading: () => m.grading_total_value_rupiah_label(),
    width: numberWidth,
    cell: (student) =>
      student.total === undefined
        ? undefined
        : numberCell(student.total.value, "wholeNumber"),
  },
  {
    heading: () => m.grading_return_label(),
    width: numberWidth,
    cell: (student) =>
      student.total === undefined
        ? undefined
        : numberCell(student.total.return, "percent"),
  },
  {
    heading: () => m.grading_sharpe_reason_label(),
    width: reasonWidth,
    cell: (student) =>
      "measures" in student && !student.measures.sharpe.ok
        ? textCell(student.measures.sharpe.failure)
        : undefined,
  },
  {
    heading: () => m.grading_treynor_reason_label(),
    width: reasonWidth,
    cell: (student) =>
      "measures" in student && !student.measures.treynor.ok
        ? textCell(student.measures.treynor.failure)
        : undefined,
  },
  {
    heading: () => m.grading_reason_label(),
    width: reasonWidth,
    cell: (student) =>
      "reason" in student ? textCell(student.reason) : undefined,
  },
];

/** The worksheet of the portfolios of the students of a class at a moment: its title, the notice that the values are a simulation at delayed prices, a row of headings, and a row for each student in the order of the page of the portfolios. The texts are in the active language. */
export function portfoliosWorksheet({
  className,
  portfolios,
  now,
  source,
  ranking = "alpha",
}: {
  className: string;
  portfolios: ClassPortfolios;
  now: Date;
  source: PriceSourceDescription;
  ranking?: RankingMeasure;
}): Worksheet {
  return {
    name: m.grading_sheet_name(),
    columnWidths: columns.map((column) => column.width),
    rows: [
      [headingCell(m.grading_page_title({ class: className }))],
      [
        textCell(
          m.grading_workbook_notice({
            measure: rankingLabel(ranking),
            time: formatMarketTime(now),
            source: source.name,
            minutes: formatNumber(source.delayMinutes),
          }),
        ),
      ],
      [],
      columns.map((column) => headingCell(column.heading())),
      ...orderStudents(portfolios, ranking).map((student) =>
        columns.map((column) => column.cell(student)),
      ),
    ],
  };
}
