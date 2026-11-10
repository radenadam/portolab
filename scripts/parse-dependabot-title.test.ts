import { expect, test } from "vitest";
import { parseDependabotTitle } from "./parse-dependabot-title.ts";

test("writes the subject of a title of Dependabot in lowercase and drops the phrase about one directory wherever it stands", () => {
  expect(
    parseDependabotTitle(
      "chore(deps): Bump anthropics/claude-code-action from 1.0.265 to 1.0.269 in the actions group across 1 directory",
      "TITLE",
    ),
  ).toEqual({
    ok: true,
    value:
      "chore(deps): bump anthropics/claude-code-action from 1.0.265 to 1.0.269 in the actions group",
  });
  expect(
    parseDependabotTitle(
      "chore(deps-dev): Bump the dependencies group across 1 directory with 6 updates",
      "TITLE",
    ),
  ).toEqual({
    ok: true,
    value: "chore(deps-dev): bump the dependencies group with 6 updates",
  });
});

test("keeps a title that is already in the style of the history, and a title without a scope", () => {
  for (const title of [
    "chore(deps-dev): bump the dependencies group with 4 updates",
    "ci: bump actions/checkout from 7.0.1 to 7.1.0",
  ]) {
    expect(parseDependabotTitle(title, "TITLE")).toEqual({
      ok: true,
      value: title,
    });
  }
});

test("rejects a title without the type of Conventional Commits", () => {
  expect(
    parseDependabotTitle("Bump vitest from 5.0.5 to 5.1.0", "TITLE"),
  ).toEqual({
    ok: false,
    failure:
      'TITLE must be a title of Dependabot with a type, such as "chore(deps): Bump vitest from 5.0.5 to 5.1.0", but it is "Bump vitest from 5.0.5 to 5.1.0".',
  });
  expect(parseDependabotTitle(undefined, "TITLE")).toEqual({
    ok: false,
    failure:
      'TITLE must be a title of Dependabot with a type, such as "chore(deps): Bump vitest from 5.0.5 to 5.1.0", but it is missing.',
  });
});
