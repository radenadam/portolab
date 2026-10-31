import type { KnipConfig } from "knip";

export default {
  // Production mode reads only the entries marked with !, so knip --production can find an export that only tests use. The scripts that CI and package.json run are listed for that reason, although knip finds them by itself in its default mode.
  entry: [
    "server/app.ts!",
    "scripts/{check-dev-server,check-messages,check-migrations,check-punctuation,choose-lenses,count-findings,post-review,print-schema,read-agent-tools,save-lens-report,save-verified-findings}.ts!",
    "project.inlang/paraglide.config.ts",
  ],
  project: ["**/*.{ts,tsx}!"],
  ignoreDependencies: ["@inlang/plugin-message-format"],
} satisfies KnipConfig;
