import { expect, test } from "vitest";
import { messageKeyProblems } from "./message-keys.ts";

test("accepts keys that start with a feature folder or with app", () => {
  const keys = ["app_name", "market_data_title"];
  expect(
    messageKeyProblems(
      new Map([
        ["id", keys],
        ["en", keys],
      ]),
      ["market-data"],
    ),
  ).toEqual([]);
});

test("rejects a key that one language lacks", () => {
  expect(
    messageKeyProblems(
      new Map([
        ["id", ["app_name", "app_back_home"]],
        ["en", ["app_name"]],
      ]),
      [],
    ),
  ).toEqual(['messages/en.json: add the message "app_back_home".']);
});

test("rejects a key that starts with no feature folder", () => {
  expect(
    messageKeyProblems(
      new Map([
        ["id", ["prices_title"]],
        ["en", ["prices_title"]],
      ]),
      ["market-data"],
    ),
  ).toEqual([
    '"prices_title": start the key with the feature folder that uses it, or with "app_" when the whole app shares it.',
  ]);
});
