import { join } from "node:path";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import {
  parseAccountCommand,
  runAccountCommand,
} from "../app/features/accounts/account-command.server.ts";
import { failuresOf } from "../app/result.ts";
import { parseDatabasePath } from "./server-options.ts";

// README.md describes this command for the person who runs the server.
const command = parseAccountCommand(process.argv.slice(2), "The command line");
const databasePath = parseDatabasePath(
  process.env["DATABASE_PATH"],
  "DATABASE_PATH",
);
if (!command.ok || !databasePath.ok) {
  exitWithFailure(failuresOf([command, databasePath]), writeFailure);
}

const database = openDatabase(
  databasePath.value,
  join(import.meta.dirname, "..", migrationsFolderName),
);
const result = await runAccountCommand(database, command.value, new Date());
closeDatabase(database);
if (!result.ok) {
  exitWithFailure([result.failure], writeFailure);
}
process.stdout.write(`${result.value}\n`);

function writeFailure(failure: string): void {
  process.stderr.write(`${failure}\n`);
}
