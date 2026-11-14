import { expect, test } from "vitest";
import { initialsOf } from "./initials-of";

test("takes the first letters of the first two words of a name in capitals", () => {
  expect(initialsOf("Nadia Putri Maharani")).toBe("NP");
  expect(initialsOf("budi santoso")).toBe("BS");
});

test("takes the first letter of a name of one word", () => {
  expect(initialsOf("Wulan")).toBe("W");
});

test("leaves out a title before the name and the degrees after a comma", () => {
  expect(initialsOf("Dr. Ratna Wulandari, S.E., M.M.")).toBe("RW");
  expect(initialsOf("Prof. Dr. Yudi Hartono")).toBe("YH");
});

test("takes the first letter of a name of titles alone", () => {
  expect(initialsOf("Dr.")).toBe("D");
});

test("keeps a letter whose accent is a code point of its own whole", () => {
  expect(initialsOf("e\u0301mile Zola")).toBe("E\u0301Z");
});
