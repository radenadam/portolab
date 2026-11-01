import { expect, test } from "vitest";
import { isReadableText, randomReadableText } from "./random-text.server";

test("makes text of the asked length from lowercase letters and digits without l, o, 0, and 1", () => {
  const seen = new Set<string>();
  for (let sample = 0; sample < 200; sample += 1) {
    const text = randomReadableText(24);
    expect(text).toMatch(/^[a-km-np-z2-9]{24}$/);
    for (const character of text) {
      seen.add(character);
    }
  }
  // 200 samples of 24 characters draw each of the 32 characters with near certainty, so a character that never appears means the alphabet lost it.
  expect(seen.size).toBe(32);
});

test("accepts only the characters that it writes", () => {
  expect(isReadableText("abcdefghijkmnpqrstuvwxyz23456789")).toBe(true);
  for (const text of ["l", "o", "0", "1", "A", "-", " "]) {
    expect(isReadableText(text), text).toBe(false);
  }
});
