import type { universeOn } from "./tracked-instruments.ts";

export function isLq45Stock(
  code: string,
  universe: ReturnType<typeof universeOn>,
): boolean {
  return universe.ok && universe.value.includes(code);
}
