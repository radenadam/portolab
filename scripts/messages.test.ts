import { expect, test } from "vitest";
import {
  messageKeyProblems,
  messageKeys,
  parseLocales,
  readMessages,
} from "./messages.ts";

test("accepts keys that start with a feature folder or with app and end with a kind of text", () => {
  const keys = ["app_name", "market_data_title", "market_data_code_label"];
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
        ["id", ["app_name", "app_back_home_link"]],
        ["en", ["app_name"]],
      ]),
      [],
    ),
  ).toEqual(['messages/en.json: add the message "app_back_home_link".']);
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

test("rejects a key that ends with no kind of text", () => {
  expect(
    messageKeyProblems(
      new Map([
        ["id", ["app_tagline"]],
        ["en", ["app_tagline"]],
      ]),
      [],
    ),
  ).toEqual([
    '"app_tagline": end the key with the kind of text it holds, which is one of _title, _body, _label, _notice, _error, _link, or _name.',
  ]);
});

test("lists the message keys without the schema key", () => {
  expect(
    messageKeys({
      $schema: "https://inlang.com/schema/inlang-message-format",
      app_name: "Portolab",
    }),
  ).toEqual(["app_name"]);
});

test("reads a language file of messages", () => {
  const messages = readMessages("messages/en.json");
  expect(messages.ok && messages.value["app_name"]).toBe("Portolab");
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
