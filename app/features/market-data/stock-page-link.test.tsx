import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import type { LessonTask } from "~/features/learning/lesson-task";
import { markupTextForTest } from "~/markup-text-for-test";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { StockPageLink } from "./stock-page-link";

const returnQuery =
  "returnTo=%2Fclasses%2F7%2Fstudents%2F11%2Fjournal%3Fview%3Djournal%23order-42";
const cases: {
  task: LessonTask | undefined;
  keepReturn: boolean;
  query: string;
}[] = [
  { task: undefined, keepReturn: false, query: "" },
  { task: 9, keepReturn: false, query: "?lessonTask=9" },
  { task: 10, keepReturn: false, query: "?lessonTask=10" },
  { task: undefined, keepReturn: true, query: `?${returnQuery}` },
  { task: 9, keepReturn: true, query: `?${returnQuery}&lessonTask=9` },
  { task: 10, keepReturn: true, query: `?${returnQuery}&lessonTask=10` },
];

for (const { task, keepReturn, query } of cases) {
  test(`keeps the stock destination with task ${String(task)} and return ${String(keepReturn)}`, () => {
    const markup = renderInRouterForTest(
      <StockPageLink
        classId={7 as ClassId}
        code="BBCA"
        id="order-42"
        keepReturn={keepReturn}
        task={task}
      >
        {"BBCA"}
      </StockPageLink>,
      undefined,
      "/classes/7/students/11/journal?view=journal",
    );
    expect(markup).toContain(
      `href="${markupTextForTest(`/classes/7/stocks/BBCA${query}`)}"`,
    );
  });
}
