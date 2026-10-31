import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// A schema change without its migration would leave every deployed database behind the code.
const migrationsDirectory = "migrations";
// The package does not export its command line file, so the path comes from its main entry.
const drizzleKit = join(
  dirname(createRequire(import.meta.url).resolve("drizzle-kit")),
  "bin.cjs",
);

const before = new Set(readdirSync(migrationsDirectory));
execFileSync(process.execPath, [drizzleKit, "generate"], { stdio: "ignore" });
const created = readdirSync(migrationsDirectory).filter(
  (file) => !before.has(file),
);

if (created.length > 0) {
  process.stderr.write(
    `The schema changed without a migration, so drizzle-kit generated ${created.join(", ")}. Review it and commit it with the schema change.\n`,
  );
  process.exit(1);
}
