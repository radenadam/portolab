import { RuleTester } from "eslint";
import typescriptEslint from "typescript-eslint";
import { describe, test } from "vitest";
import { messageFeature } from "./message-feature.ts";

RuleTester.describe = describe;
RuleTester.it = test;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parser: typescriptEslint.parser },
});
const filename = "/repo/app/features/market-data/view.js";
const wrongUse = {
  messageId: "prefix",
  data: {
    key: "measures_stock_statistics_notice",
    feature: "market-data",
    prefix: "market_data",
  },
};

const wrongUses = [
  'const { m } = await import("~/paraglide/messages.js"); m.measures_stock_statistics_notice();',
  'const { m: texts } = await import("~/paraglide/messages.js"); texts.measures_stock_statistics_notice();',
  'const { measures_stock_statistics_notice: label } = await import("~/paraglide/messages.js");',
  'const all = await import("~/paraglide/messages.js"); all.m.measures_stock_statistics_notice();',
  '(await import("../../paraglide/messages.js")).m["measures_stock_statistics_notice"]();',
  'const source = "~/paraglide/messages.js"; const { m } = await import(source); m.measures_stock_statistics_notice();',
  'const pending = import("~/paraglide/messages.js"); const alias = pending; const { m } = await alias; m.measures_stock_statistics_notice();',
  'let pending; pending = import("~/paraglide/messages.js"); const { m } = await pending; m.measures_stock_statistics_notice();',
  'const pending = condition ? import("~/paraglide/messages.js") : import("other"); const { m } = await pending; m.measures_stock_statistics_notice();',
  'const pending = existing || import("~/paraglide/messages.js"); const { m } = await pending; m.measures_stock_statistics_notice();',
  'import("~/paraglide/messages.js").then(all => all.m.measures_stock_statistics_notice());',
  'import("~/paraglide/messages.js").then(({ m }) => m.measures_stock_statistics_notice());',
  'import("~/paraglide/messages.js").then(({ m: { measures_stock_statistics_notice: label } }) => label());',
  'const pending = import("~/paraglide/messages.js"); pending.then(function ({ measures_stock_statistics_notice: label }) { label(); });',
  'import("~/paraglide/messages.js").then(({ m, ...all }) => all.measures_stock_statistics_notice());',
  'import type { measures_stock_statistics_notice as Label } from "~/paraglide/messages.js";',
  'export type { measures_stock_statistics_notice as Label } from "~/paraglide/messages.js";',
  'm.measures_stock_statistics_notice(); import { m } from "~/paraglide/messages.js";',
  'import { m } from "~/paraglide/messages.js"; m.measures_stock_statistics_notice();',
  'import { m as texts } from "~/paraglide/messages.js"; texts["measures_stock_statistics_notice"]();',
  'import { measures_stock_statistics_notice } from "~/paraglide/messages.js";',
  'import { measures_stock_statistics_notice as label } from "~/paraglide/messages.js";',
  'import { "measures_stock_statistics_notice" as label } from "~/paraglide/messages.js";',
  'import * as all from "~/paraglide/messages.js"; all.measures_stock_statistics_notice();',
  'import * as all from "~/paraglide/messages.js"; all.m.measures_stock_statistics_notice();',
  'import * as all from "~/paraglide/messages.js"; all["m"]["measures_stock_statistics_notice"]();',
  'import { m } from "~/paraglide/messages.js"; const { measures_stock_statistics_notice } = m;',
  'import { m } from "~/paraglide/messages.js"; const { "measures_stock_statistics_notice": label } = m;',
  'import { m } from "~/paraglide/messages.js"; const { ["measures_stock_statistics_notice"]: label } = m;',
  'import { m } from "~/paraglide/messages.js"; const { measures_stock_statistics_notice: label = fallback } = m;',
  'import * as all from "~/paraglide/messages.js"; const { m: { measures_stock_statistics_notice: label } } = all;',
  'import * as all from "~/paraglide/messages.js"; const { m: texts } = all; texts.measures_stock_statistics_notice();',
  'import { m } from "~/paraglide/messages.js"; const texts = m; texts.measures_stock_statistics_notice();',
  'import { m } from "~/paraglide/messages.js"; let texts; texts = m; texts.measures_stock_statistics_notice();',
  'import { m } from "~/paraglide/messages.js"; let label; ({ measures_stock_statistics_notice: label } = m);',
  'import { m } from "../../paraglide/messages.js"; m.measures_stock_statistics_notice();',
  'import { measures_stock_statistics_notice } from "~/paraglide/messages/_index.js";',
  'export { measures_stock_statistics_notice as label } from "~/paraglide/messages.js";',
];

tester.run("message-feature", messageFeature, {
  valid: [
    ...[
      'const { m } = await import("~/paraglide/messages.js"); m.market_data_stock_title();',
      'const { m } = await import("other/messages.js"); m.measures_stock_statistics_notice();',
      'import("~/paraglide/messages.js").then(({ m }) => m.app_name());',
      'import("other/messages.js").then(all => all.measures_stock_statistics_notice());',
      "const pending = pending; const { m } = await pending; m.measures_stock_statistics_notice();",
      'export * from "./own-module.js";',
      'export * from "~/paraglide/messages/market_data_page_title.js";',
      'export * as name from "~/paraglide/messages/app_name.js";',
      'import type { market_data_stock_title as Label } from "~/paraglide/messages.js";',
    ].map((code) => ({ filename, code })),
    ...[
      'import { m } from "~/paraglide/messages.js"; m.market_data_stock_title();',
      'import { m as texts } from "~/paraglide/messages.js"; texts.app_name();',
      'import { market_data_stock_title as title, app_name } from "~/paraglide/messages.js";',
      'import * as all from "~/paraglide/messages.js"; all.m.market_data_stock_title();',
      'import * as all from "~/paraglide/messages.js"; all.market_data_stock_title();',
      'import { m } from "~/paraglide/messages.js"; const { market_data_stock_title: title } = m;',
      'import { m } from "~/paraglide/messages.js"; function other(m) { m.measures_stock_statistics_notice(); }',
      'import { m } from "other/messages.js"; m.measures_stock_statistics_notice();',
      "const m = { measures_stock_title() {} }; m.measures_stock_title();",
    ].map((code) => ({ filename, code })),
    {
      filename: "/repo/app/features/classes/join-class-page.tsx",
      code: 'import { m } from "~/paraglide/messages.js"; m.accounts_username_label();',
    },
    {
      filename: "/repo/app/example.js",
      code: 'import { measures_stock_statistics_notice } from "~/paraglide/messages.js";',
    },
  ],
  invalid: [
    ...[
      'export * from "~/paraglide/messages.js";',
      'export * as texts from "~/paraglide/messages.js";',
      'export * from "~/paraglide/messages/measures_stock_statistics_notice.js";',
      'export type * from "../../paraglide/messages.js";',
      'export { m as texts } from "~/paraglide/messages.js";',
      'export { "m" as texts } from "~/paraglide/messages.js";',
    ].map((code) => ({
      filename,
      code,
      errors: [{ messageId: "namespace", data: { feature: "market-data" } }],
    })),
    ...wrongUses.map((code) => ({ filename, code, errors: [wrongUse] })),
    {
      filename: "C:\\repo\\app\\features\\market-data\\view.js",
      code: wrongUses[1] ?? "",
      errors: [wrongUse],
    },
    {
      filename: "/repo/app/features/classes/another-page.tsx",
      code: 'import { m } from "~/paraglide/messages.js"; m.accounts_username_label();',
      errors: [
        {
          messageId: "prefix",
          data: {
            key: "accounts_username_label",
            feature: "classes",
            prefix: "classes",
          },
        },
      ],
    },
  ],
});
