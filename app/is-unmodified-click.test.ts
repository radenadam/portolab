import { expect, test } from "vitest";
import { isUnmodifiedClick } from "./is-unmodified-click";

const plain = {
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

test("enhances only an unmodified primary click that another handler has not prevented", () => {
  expect(isUnmodifiedClick(plain)).toBe(true);
  for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const)
    expect(isUnmodifiedClick({ ...plain, [modifier]: true })).toBe(false);
  expect(isUnmodifiedClick({ ...plain, defaultPrevented: true })).toBe(false);
  for (const button of [1, 2])
    expect(isUnmodifiedClick({ ...plain, button })).toBe(false);
});
