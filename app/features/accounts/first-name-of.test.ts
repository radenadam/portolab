import { expect, test } from "vitest";
import { firstNameOf } from "./first-name-of";

test("uses the first word for a greeting and keeps a mononym or numeric name as text", () => {
  for (const [name, first] of [
    ["Nara Kirana Prameswari", "Nara"],
    ["Teguh", "Teguh"],
    ["12345 67890", "12345"],
  ] as const)
    expect(firstNameOf(name)).toBe(first);
});
