import { expect, test } from "vitest";
import {
  messageKeyProblems,
  parseLocales,
  parseMessages,
  readMessages,
} from "./messages.ts";

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

test("reads a language file of messages", () => {
  const messages = readMessages("messages/en.json");
  expect(messages.ok && messages.value["app_name"]).toBe("Portolab");
});

test("rejects messages that are not a JSON object", () => {
  expect(parseMessages(["app_name"], "messages/en.json")).toEqual({
    ok: false,
    failure: "messages/en.json must be a JSON object of messages.",
  });
});

test("reports a messages file that cannot be read", () => {
  const messages = readMessages("messages/missing.json");
  expect(messages.ok ? "" : messages.failure).toMatch(
    /^messages\/missing\.json cannot be read\. The system reported: /,
  );
});

test("reads the locales from the inlang settings and rejects settings without them", () => {
  expect(parseLocales({ locales: ["id", "en"] }, "settings.json")).toEqual({
    ok: true,
    value: ["id", "en"],
  });
  expect(parseLocales({}, "settings.json")).toEqual({
    ok: false,
    failure: 'settings.json has no valid "locales".',
  });
});
