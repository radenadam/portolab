import { RuleTester } from "eslint";
import { describe, test } from "vitest";
import { messageFeature } from "./message-feature.ts";

RuleTester.describe = describe;
RuleTester.it = test;

const tester = new RuleTester({ languageOptions: { sourceType: "module" } });
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
