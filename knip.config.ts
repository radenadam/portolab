import type { KnipConfig } from "knip";

export default {
  // Production mode reads only the entries marked with !, so knip --production can find a module or an export that only tests use. The scripts that CI and package.json run are listed for that reason, although knip finds them by itself in its default mode.
  entry: [
    "server/app.ts!",
    "server/account.ts!",
    "scripts/{check-dev-server,check-messages,check-migrations,check-punctuation,check-workflows,measure-agent-run,plan-deployment-test,plan-review,post-review,print-dependabot-subject,print-schema,read-agent-tools,run-deployment-guide,save-findings,write-review-files}.ts!",
    "project.inlang/paraglide.config.ts",
    // The order ticket and the page of a stock of issue #127 call measureTrade, with HeldStock, ConsideredTrade, and TradeImpact, once they show what a trade does to the portfolio.
    "app/features/measures/measure-trade.ts!",
    // The list of the market and the holdings of the home of a student of issue #127 call Sparkline, once they show the closes of the last month of each stock.
    "app/charts/sparkline.tsx!",
  ],
  // Helpers of tests, browser tests, and lint rules are not production code, so the production run leaves them out.
  project: [
    "**/*.{ts,tsx}!",
    "!**/*-for-test{,.server}.{ts,tsx}!",
    "!e2e/**!",
    "!lint/**!",
  ],
  ignoreDependencies: ["@inlang/plugin-message-format"],
} satisfies KnipConfig;
