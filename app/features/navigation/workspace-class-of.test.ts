import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { workspaceClassOf } from "./workspace-class-of";

// The classes of a person in the order in which the person joined them.
const classes = [{ id: 3 as ClassId }, { id: 5 as ClassId }];

test("chooses the class of the address when the person belongs to it, before the class that the person opened last", () => {
  expect(
    workspaceClassOf(classes, {
      addressed: 3 as ClassId,
      lastOpened: 5 as ClassId,
    }),
  ).toEqual({ id: 3 });
});

test("chooses the class that the person opened last when the address names no class of the person", () => {
  for (const addressed of [undefined, 9 as ClassId]) {
    expect(
      workspaceClassOf(classes, { addressed, lastOpened: 3 as ClassId }),
    ).toEqual({ id: 3 });
  }
});

test("chooses the class that the person joined last when the person opened none of the classes, or opened one that the person left", () => {
  for (const lastOpened of [undefined, 9 as ClassId]) {
    expect(
      workspaceClassOf(classes, { addressed: undefined, lastOpened }),
    ).toEqual({ id: 5 });
  }
});

test("chooses no class for a person without one", () => {
  const noClasses: { id: ClassId }[] = [];
  expect(
    workspaceClassOf(noClasses, {
      addressed: 3 as ClassId,
      lastOpened: 3 as ClassId,
    }),
  ).toBeUndefined();
});
