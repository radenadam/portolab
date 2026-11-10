import type { KnipConfig } from "knip";

export default {
  // Production mode reads only the entries marked with !, so knip --production can find a module or an export that only tests use. The scripts that CI and package.json run are listed for that reason, although knip finds them by itself in its default mode.
  entry: [
    "server/app.ts!",
    "server/account.ts!",
    "scripts/{check-dev-server,check-messages,check-migrations,check-punctuation,check-workflows,measure-agent-run,plan-review,post-review,print-dependabot-subject,print-schema,read-agent-tools,save-findings,write-review-files}.ts!",
    "project.inlang/paraglide.config.ts",
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
