import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { errorMessage } from "../app/error-message.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { unexpectedMigrations } from "./unexpected-migrations.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// A schema change without its migration would leave every deployed database behind the code.
const migrationsDirectory = "migrations";
// The package does not export its command line file, so the path comes from its main entry.
const drizzleKit = join(
  dirname(createRequire(import.meta.url).resolve("drizzle-kit")),
  "bin.cjs",
);

const filesBefore = readdirSync(migrationsDirectory);
// The error of a failed child process includes its stderr only when the stderr is piped.
try {
  execFileSync(process.execPath, [drizzleKit, "generate"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
} catch (error) {
  exitWithFailure(
    [
      `drizzle-kit could not compare the schema with the migrations. It reported: ${errorMessage(error)}`,
    ],
    writeScriptFailure,
  );
}
const problem = unexpectedMigrations(
  filesBefore,
  readdirSync(migrationsDirectory),
);
if (problem !== undefined) {
  exitWithFailure([problem], writeScriptFailure);
}
