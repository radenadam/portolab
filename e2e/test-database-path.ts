import { successValueForTest } from "../app/success-value-for-test.ts";
import { parseFilePath } from "../app/value-parsers.ts";
import { databasePathVariable } from "./test-server.ts";

/** The path of the database of the test server, which the global setup gives to the tests. */
export function testDatabasePath(): string {
  return successValueForTest(
    parseFilePath(process.env[databasePathVariable], databasePathVariable),
    `The test server sets ${databasePathVariable}`,
  );
}
