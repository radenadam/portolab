import { expect, test } from "vitest";
import { parseSampleCredentialsForTest } from "./parse-sample-credentials-for-test.ts";

test("reads the first printed account of each role", () => {
  expect(
    parseSampleCredentialsForTest(
      "Sample class: Example\nJoin code: ABC123\nlecturer | example-lecturer | generated-one\nstudent | example-1 | generated-two\nstudent | example-2 | generated-two\n",
      "The sample output",
    ),
  ).toEqual({
    ok: true,
    value: {
      lecturer: { username: "example-lecturer", password: "generated-one" },
      student: { username: "example-1", password: "generated-two" },
    },
  });
});

test("rejects output without credentials for both roles", () => {
  for (const [value, description] of [
    [undefined, "missing"],
    ["", "empty"],
    ["lecturer | name | password", '"lecturer | name | password"'],
    ["student | name | password", '"student | name | password"'],
    [
      "lecturer | name | \nstudent | name | password",
      '"lecturer | name | \\nstudent | name | password"',
    ],
  ] as const) {
    expect(parseSampleCredentialsForTest(value, "The sample output")).toEqual({
      ok: false,
      failure: `The sample output must print a username and password for both sample roles, but it is ${description}.`,
    });
  }
});
