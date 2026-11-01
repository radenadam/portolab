import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { drizzleKitFailure } from "./drizzle-kit-failure.ts";
import { unexpectedMigrations } from "./unexpected-migrations.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The package does not export its command line file, so the path comes from its main entry.
const drizzleKit = join(
  dirname(createRequire(import.meta.url).resolve("drizzle-kit")),
  "bin.cjs",
);

// A schema change without its migration would leave every deployed database behind the code.
const filesBefore = readdirSync(migrationsFolderName);
const run = spawnSync(process.execPath, [drizzleKit, "generate"], {
  stdio: ["ignore", "ignore", "pipe"],
  encoding: "utf8",
});
const failure = drizzleKitFailure(run);
if (failure !== undefined) {
  exitWithFailure([failure], writeScriptFailure);
}
const problem = unexpectedMigrations(
  filesBefore,
  readdirSync(migrationsFolderName),
);
if (problem !== undefined) {
  exitWithFailure([problem], writeScriptFailure);
}
