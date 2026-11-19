import { expect, test } from "vitest";
import { classRankingForTest } from "./class-ranking-for-test.server";
import { orderStudents } from "./order-students";
import { StudentStandings } from "./student-standings";
import type { StudentOptions } from "./students-address";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";

const texts: Record<
  Locale,
  { headings: readonly string[]; numbers: readonly string[]; missing: string }
> = {
  id: {
    headings: [
      "Peringkat",
      "Mahasiswa",
      "Imbal hasil",
      "Beta",
      "Risiko/bln",
      "Treynor ↓",
      "Order terakhir",
    ],
    numbers: ["Risiko/bln", "Treynor ↓"],
    missing: "Alasan ukuran ini belum tersedia",
  },
  en: {
    headings: [
      "Rank",
      "Student",
      "Return",
      "Beta",
      "Risk/month",
      "Treynor ↓",
      "Latest order",
    ],
    numbers: ["Risk/month", "Treynor ↓"],
    missing: "Why this measure is unavailable",
  },
};

async function standingsForTest(
  pick: (all: ReturnType<typeof orderStudents>) => StudentOptions["studentId"],
) {
  const { taughtClass, portfolios } = await classRankingForTest();
  const all = orderStudents(portfolios, "treynor");
  const studentId = pick(all);
  return {
    classId: taughtClass.id,
    all,
    studentId,
    html: renderInRouterForTest(
      <StudentStandings
        classId={taughtClass.id}
        all={all}
        shown={all}
        options={{
          measure: "treynor",
          filter: "inactive",
          query: "",
          studentId,
        }}
        selected={all.find((student) => student.studentId === studentId)}
      />,
      conceptLessonDataForTest(),
    ),
  };
}

function cellTexts(markup: string): string[] {
  return [...markup.matchAll(/<th\b[^>]*>(.*?)<\/th>/gu)].map(([, cell]) =>
    (cell ?? "").replaceAll(/<[^>]+>/gu, ""),
  );
}

for (const locale of locales) {
  test(`names each column, puts the heads of the number columns at the end of their columns, and explains a missing measure in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { html, all } = await standingsForTest(() => undefined);
    const head = html.slice(html.indexOf("<thead>"), html.indexOf("</thead>"));
    expect(cellTexts(head)).toEqual(
      texts[locale].headings.map((heading) => markupTextForTest(heading)),
    );
    const numberHeads = [
      ...head.matchAll(/<th\b[^>]*class="_numberHeading_[^>]*>.*?<\/th>/gu),
    ].map(([cell]) => cell);
    expect(cellTexts(numberHeads.join(""))).toEqual(
      texts[locale].numbers.map((heading) => markupTextForTest(heading)),
    );
    const reasons = all.flatMap((student) =>
      "reason" in student ? [student.reason] : [],
    );
    expect(reasons.length).toBeGreaterThan(0);
    expect(html).toContain(`<summary>${texts[locale].missing}</summary>`);
    for (const reason of reasons)
      expect(html).toContain(markupTextForTest(reason));
  });
}

test("opens the portfolio of a student from the whole row, with the list and its controls as the way back to that row", async () => {
  const { html, all, classId } = await standingsForTest(() => undefined);
  const links = [
    ...html.matchAll(/<td class="_who_[^"]*"><a (?:[^>]*? )?href="([^"]+)"/gu),
  ].map(
    ([, href]) =>
      new URL((href ?? "").replaceAll("&amp;", "&"), "http://localhost"),
  );
  expect(links).toHaveLength(all.length);
  for (const [index, student] of all.entries()) {
    const id = String(student.studentId);
    expect(html).toContain(`<tr id="student-${id}">`);
    expect(links[index]?.pathname).toBe(
      `/classes/${String(classId)}/students/${id}`,
    );
    expect(links[index]?.searchParams.get("returnTo")).toBe(
      `/classes/${String(classId)}/students?measure=treynor&filter=inactive&student=${id}#student-${id}`,
    );
  }
  expect(html).not.toContain("aria-current");
  expect(html).not.toContain("_selected_");
});

test("marks only the row of the student whom the lecturer came back from", async () => {
  const { html, studentId } = await standingsForTest(
    (all) => all[1]?.studentId,
  );
  if (studentId === undefined) throw new Error("The fixture has six students.");
  expect(html.match(/aria-current="true"/gu)).toHaveLength(1);
  expect(html.match(/_selected_/gu)).toHaveLength(1);
  const row = html.slice(html.indexOf(`<tr id="student-${String(studentId)}"`));
  expect(row).toMatch(/^<tr id="student-\d+" class="_selected_/u);
  expect(row.slice(0, row.indexOf("</tr>"))).toContain('aria-current="true"');
});
