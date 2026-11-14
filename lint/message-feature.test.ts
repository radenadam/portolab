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

tester.run("message-feature", messageFeature, {
  valid: [
    {
      filename,
      code: 'import { m } from "~/paraglide/messages.js"; m.market_data_stock_title();',
    },
    {
      filename,
      code: 'import { m as texts } from "~/paraglide/messages.js"; texts.app_name();',
    },
    {
      filename,
      code: "const m = { measures_stock_title() {} }; m.measures_stock_title();",
    },
    {
      filename: "/repo/app/features/classes/join-class-page.tsx",
      code: 'import { m } from "~/paraglide/messages.js"; m.accounts_username_label();',
    },
  ],
  invalid: [
    {
      filename,
      code: 'm.measures_stock_statistics_notice(); import { m } from "~/paraglide/messages.js";',
      errors: [wrongUse],
    },
    {
      filename,
      code: 'import { m } from "~/paraglide/messages.js"; m.measures_stock_statistics_notice();',
      errors: [wrongUse],
    },
    {
      filename,
      code: 'import { m as texts } from "~/paraglide/messages.js"; texts["measures_stock_statistics_notice"]();',
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
