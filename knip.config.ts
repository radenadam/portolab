import type { KnipConfig } from "knip";

export default {
  // Production mode reads only the entries marked with !, so knip --production can find a module or an export that only tests use. The scripts that CI and package.json run are listed for that reason, although knip finds them by itself in its default mode.
  entry: [
    "server/app.ts!",
    "server/account.ts!",
    "scripts/{check-dev-server,check-messages,check-migrations,check-punctuation,check-workflows,describe-agent-run,plan-review,post-review,print-schema,read-agent-tools,save-findings,save-verdicts}.ts!",
    "project.inlang/paraglide.config.ts",
    // The screens of issues #8 and #9 will call measureStoredStock and measureStoredPortfolio, which landed before them because the plan of the first release builds the calculations first. Remove this entry when those screens import the module.
    "app/features/measures/measure-stored.server.ts!",
    // The order screens and the check of orders of issue #7 will call orderTradingDay, parseOrderLots, placeOrder, isOpenOrder, hasOpenState, checkOrder, holdingAfterFill, orderFailureText, and limitPriceFailureText, which landed before them because this change settles the rules and the texts of orders before a table stores orders. Remove this entry when those screens and that check import the modules.
    "app/features/trading/{order-trading-day,place-order,parse-order-lots,check-order,holding-after-fill,order-failure-text,open-orders}.ts!",
  ],
  // Helpers of tests, browser tests, and lint rules are not production code, so the production run leaves them out.
  project: [
    "**/*.{ts,tsx}!",
    "!**/*-for-test{,.server}.ts!",
    "!e2e/**!",
    "!lint/**!",
  ],
  ignoreDependencies: ["@inlang/plugin-message-format"],
} satisfies KnipConfig;
