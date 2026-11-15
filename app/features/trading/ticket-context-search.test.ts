import { expect, test } from "vitest";
import { ticketContextSearch } from "./ticket-context-search";

test("keeps the chart and lesson context while discarding ticket fields and its success marker", () => {
  expect(
    ticketContextSearch(
      new URLSearchParams(
        "range=3m&lessonTask=9&lots=2&price=4980&limit=4980&priceKind=limit&reason=thesis&placed=1",
      ),
    ),
  ).toBe("?range=3m&lessonTask=9");
  expect(ticketContextSearch(new URLSearchParams("lots=2"))).toBe("");
});
