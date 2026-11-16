import { expect, test } from "vitest";
import { languageNames } from "../../language-names";
import { locales } from "../../paraglide/runtime.js";
import type { Locale } from "../../paraglide/runtime.js";
import { parseGuideLabels } from "./parse-guide-labels";

const texts: Record<Locale, { class: string; students: string; buy: string }> =
  {
    id: { class: "Kelas", students: "Mahasiswa", buy: "Beli" },
    en: { class: "Class", students: "Students", buy: "Buy" },
  };

for (const locale of locales) {
  test(`selects only static labels, links, and titles from a message catalogue in ${languageNames[locale]}`, () => {
    const text = texts[locale];
    expect(
      parseGuideLabels(
        {
          $schema: "schema.json",
          navigation_class_link: text.class,
          grading_students_title: text.students,
          trading_buy_label: text.buy,
          classes_share_notice: "Share {cash}",
          classes_join_chip_label: "Code {code}",
          app_help_body: "Help",
        },
        "Messages",
      ),
    ).toEqual({
      ok: true,
      value: new Map([
        ["label:navigation_class_link", text.class],
        ["label:grading_students_title", text.students],
        ["label:trading_buy_label", text.buy],
      ]),
    });
  });
}

test.each([undefined, null, [], "text", 5])(
  "rejects a catalogue that is not an object: %j",
  (value) => {
    const result = parseGuideLabels(value, "messages/id.json");
    expect(result).toMatchObject({ ok: false });
    if (!result.ok)
      expect(result.failure).toContain(
        "messages/id.json must map message keys to text, but it is",
      );
  },
);

test("reports every non-text message with its source and value", () => {
  expect(
    parseGuideLabels(
      { first_label: 5, second_title: false, third_link: ["link"] },
      "messages/en.json",
    ),
  ).toEqual({
    ok: false,
    failure:
      'messages/en.json.first_label must be text, but it is 5.\nmessages/en.json.second_title must be text, but it is false.\nmessages/en.json.third_link must be text, but it is ["link"].',
  });
});
