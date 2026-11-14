import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { checkSlotVariable, parseCheckSettings } from "./check-settings.ts";
import type { CheckSettings } from "./check-settings.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

export function readCheckSettings(): CheckSettings {
  const settings = parseCheckSettings(
    process.env[checkSlotVariable],
    checkSlotVariable,
  );
  if (!settings.ok) {
    exitWithFailure([settings.failure], writeScriptFailure);
  }
  return settings.value;
}
