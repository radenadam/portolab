import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue } from "../app/value-shapes.ts";

export const checkSlotVariable = "PORTOLAB_CHECK_SLOT";
const maximumSlot = 99;
const defaultBrowserPort = 4173;
const defaultDevelopmentPort = 4174;
// Vite uses this port for its WebSocket server in middleware mode.
const defaultHotReloadPort = 24_678;
const httpPortsPerSlot = 2;

export interface CheckSettings {
  browser: number;
  development: number;
  hotReload: number;
  maximumWorkers: "25%" | undefined;
}

/** Keeps the port ranges apart, so every accepted slot can run beside every other slot. */
export function parseCheckSettings(
  value: unknown,
  source: string,
): Result<CheckSettings, string> {
  const text = value === undefined ? "0" : value;
  if (typeof text === "string" && text.length > 0 && !/\D/.test(text)) {
    const slot = Number(text);
    if (slot >= 0 && slot <= maximumSlot) {
      return succeed({
        browser: defaultBrowserPort + slot * httpPortsPerSlot,
        development: defaultDevelopmentPort + slot * httpPortsPerSlot,
        hotReload: defaultHotReloadPort + slot,
        // Concurrent checks exceeded test timeouts with the default worker pools.
        maximumWorkers: slot === 0 ? undefined : "25%",
      });
    }
  }
  return fail(
    `${source} must be a whole number from 0 to ${String(maximumSlot)}, but it is ${describeValue(value)}.`,
  );
}
