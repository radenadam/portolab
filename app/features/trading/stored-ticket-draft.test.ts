import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { blankOrderForm } from "./order-form-fields";
import {
  readStoredTicketDraft,
  writeStoredTicketDraft,
} from "./stored-ticket-draft";

function storageForTest(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("restores all draft fields without persisting translated validation errors", () => {
  const storage = storageForTest();
  const fields = {
    ...blankOrderForm,
    priceKind: "limit",
    lots: "37",
    limit: "4.980",
    reason: "An unfinished reason.",
    reasonFailure: "An old error.",
  };
  expect(readStoredTicketDraft(storage, "draft")).toEqual({
    ok: true,
    value: undefined,
  });
  writeStoredTicketDraft(storage, "draft", fields);
  expect(readStoredTicketDraft(storage, "draft")).toEqual({
    ok: true,
    value: { ...fields, reasonFailure: undefined },
  });
  expect(storage.getItem("draft")).not.toContain("Failure");
});

test("bounds every persisted field and removes a draft whose fields are too long", () => {
  const storage = storageForTest();
  for (const field of ["priceKind", "lots", "limit", "reason"] as const) {
    for (const length of [
      fieldMaximumLength,
      fieldMaximumLength + 1,
      fieldMaximumLength * 10,
    ]) {
      const fields = { ...blankOrderForm, [field]: "W".repeat(length) };
      writeStoredTicketDraft(storage, "draft", fields);
      expect(storage.getItem("draft") !== null).toBe(
        length === fieldMaximumLength,
      );
      storage.setItem("Stored draft", JSON.stringify(fields));
      const parsed = readStoredTicketDraft(storage, "Stored draft");
      expect(parsed).toEqual(
        length === fieldMaximumLength
          ? { ok: true, value: fields }
          : {
              ok: false,
              failure: `Stored draft.${field} must have at most ${String(fieldMaximumLength)} characters, but it has ${String(length)}.`,
            },
      );
    }
  }
});

test("names every invalid stored field and refuses malformed JSON", () => {
  const storage = storageForTest();
  storage.setItem("draft", "{");
  expect(readStoredTicketDraft(storage, "draft")).toEqual({
    ok: false,
    failure: "draft must be an order draft in JSON, but it is invalid JSON.",
  });
  for (const [value, description] of [
    [null, "null"],
    [[], "[]"],
    ["text", '"text"'],
    [17, "17"],
  ] as const) {
    storage.setItem("draft", JSON.stringify(value));
    expect(readStoredTicketDraft(storage, "draft")).toEqual({
      ok: false,
      failure: `draft must be an order draft, but it is ${description}.`,
    });
  }
  storage.setItem(
    "Stored draft",
    JSON.stringify({ priceKind: 17, lots: null, limit: false }),
  );
  expect(readStoredTicketDraft(storage, "Stored draft")).toEqual({
    ok: false,
    failure: [
      "Stored draft.priceKind must be text, but it is 17.",
      "Stored draft.lots must be text, but it is null.",
      "Stored draft.limit must be text, but it is false.",
      "Stored draft.reason must be text, but it is missing.",
    ].join("\n"),
  });
});
