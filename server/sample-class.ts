import { join } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { failuresOf } from "../app/result.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { parseDatabasePath, parsePriceSource } from "./server-options.ts";
import type { ServiceSettings } from "./server-options.ts";

const databasePath = parseDatabasePath(
  process.env["DATABASE_PATH"],
  "DATABASE_PATH",
);
const source = parsePriceSource(process.env["PRICE_SOURCE"], "PRICE_SOURCE");
if (!databasePath.ok || !source.ok)
  exitWithFailure(failuresOf([databasePath, source]), writeFailure);

// Like server/main.ts, this loads only the server's own build, whose type is known.
interface SampleBuild {
  runSampleClass: (
    settings: Pick<
      ServiceSettings,
      "databasePath" | "priceSource" | "migrationsFolder"
    >,
    clock: () => Date,
  ) => Promise<{ ok: true; value: string } | { ok: false; failure: string }>;
}
const buildPath = join(
  import.meta.dirname,
  "..",
  "build",
  "server",
  "index.js",
);
if (!existsSync(buildPath))
  exitWithFailure(
    [
      `The sample command needs the server build at ${buildPath}. Run pnpm build first.`,
    ],
    writeFailure,
  );
try {
  const build = (await import(pathToFileURL(buildPath).href)) as SampleBuild;
  const result = await build.runSampleClass(
    {
      databasePath: databasePath.value,
      priceSource: source.value,
      migrationsFolder: join(import.meta.dirname, "..", migrationsFolderName),
    },
    () => new Date(),
  );
  if (!result.ok) exitWithFailure([result.failure], writeFailure);
  process.stdout.write(`${result.value}\n`);
} catch (error) {
  exitWithFailure(
    [
      `The sample command failed for DATABASE_PATH ${databasePath.value}. ${error instanceof Error ? error.message : String(error)}`,
    ],
    writeFailure,
  );
}

function writeFailure(failure: string): void {
  process.stderr.write(`${failure}\n`);
}
