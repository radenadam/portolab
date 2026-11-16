import { RuleTester } from "eslint";
import globals from "globals";
import typescriptEslint from "typescript-eslint";
import { describe, test } from "vitest";
import { intlFormats } from "./intl-formats.ts";

RuleTester.describe = describe;
RuleTester.it = test;

const tester = new RuleTester({
  // The modules of the app run in the browser too, so window and self are global objects there.
  languageOptions: {
    sourceType: "module",
    parser: typescriptEslint.parser,
    globals: globals.browser,
  },
});
const format = { messageId: "format" };

const rejected = [
  'new Intl.NumberFormat("en").format(1);',
  'Intl.DateTimeFormat("en").format(new Date());',
  'new Intl.ListFormat("en").format(["a", "b"]);',
  'new Intl.RelativeTimeFormat("en").format(1, "day");',
  'new Intl.DisplayNames("en", { type: "region" }).of("ID");',
  'new Intl.DurationFormat("en").format({ hours: 1 });',
  'new Intl.PluralRules("en").select(1);',
  'new Intl["NumberFormat"]("en");',
  'new Intl[`NumberFormat`]("en");',
  "const Format = Intl?.NumberFormat;",
  'const name = "NumberFormat"; new Intl[name]("en");',
  "const { NumberFormat } = Intl;",
  "const { NumberFormat: Format } = Intl;",
  'const { ["NumberFormat"]: Format } = Intl;',
  "let Format; ({ NumberFormat: Format } = Intl);",
  'const formats = Intl; new formats.NumberFormat("en");',
  'function format(formats = Intl) { return new formats.NumberFormat("en"); }',
  'Reflect.get(Intl, "NumberFormat");',
  'new globalThis.Intl.NumberFormat("en");',
  'new window.Intl.DateTimeFormat("en");',
  'new self.Intl.NumberFormat("en");',
  'new globalThis["Intl"].NumberFormat("en");',
  "const { Intl: formats } = globalThis;",
  '(1).toLocaleString("en");',
  'new Date().toLocaleDateString("en");',
  'new Date().toLocaleTimeString("en");',
  "[1, 2].toLocaleString();",
  'value["toLocaleString"]();',
  "value[`toLocaleDateString`]();",
  "value?.toLocaleString();",
  "Number.prototype.toLocaleString.call(1);",
  "const { toLocaleString } = Number.prototype;",
  'const { ["toLocaleTimeString"]: write } = Date.prototype;',
];

const accepted = [
  'new Intl.Collator("en").compare("a", "b");',
  'new Intl.Segmenter("en", { granularity: "grapheme" }).segment("a");',
  'Intl["Collator"]("en");',
  "const options: Intl.NumberFormatOptions = {};",
  "type Part = Intl.DateTimeFormatPart;",
  "function parts(format: Intl.DateTimeFormat): void {}",
  "type Format = typeof Intl.NumberFormat;",
  'value.toLocaleUpperCase("id");',
  'value.toLocaleLowerCase("en");',
  "const { toString } = value;",
];

tester.run("intl-formats", intlFormats, {
  valid: accepted,
  invalid: rejected.map((code) => ({ code, errors: [format] })),
});
