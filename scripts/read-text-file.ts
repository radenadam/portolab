import { readFileSync } from "node:fs";
import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

export function readTextFile(path: string): Result<string, string> {
  try {
    return succeed(readFileSync(path, "utf8"));
  } catch (error) {
    return fail(
      `${path} cannot be read. The system reported: ${errorMessage(error)}`,
    );
  }
}
