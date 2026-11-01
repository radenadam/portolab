import type { KnipConfig } from "knip";

export default {
  // Production mode reads only the entries marked with !, so knip --production can find a module or an export that only tests use. The scripts that CI and package.json run are listed for that reason, although knip finds them by itself in its default mode.
  entry: [
    "server/app.ts!",
    "scripts/{check-dev-server,check-messages,check-migrations,check-punctuation,check-workflows,choose-lenses,count-findings,post-review,print-schema,read-agent-tools,save-lens-report,save-verified-findings}.ts!",
    "project.inlang/paraglide.config.ts",
    // The screens of issues #8 and #9 will call the measures, which landed before them because the plan of the first release builds the calculations first. Remove this entry when those screens import the module.
    "app/features/measures/measure-stored.server.ts!",
    // The order screens of issue #7 will call the order engine and make the lots of each order, which landed before them because the accounts and classes that store orders were not done yet. Remove these entries when those screens import the modules.
    "app/features/trading/{place-order,check-order,holding-after-fill,order-failure-text,open-orders}.ts!",
    "app/units/lots.ts!",
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
