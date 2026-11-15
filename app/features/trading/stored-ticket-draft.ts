import { fieldMaximumLength } from "~/form-size";
import { blankOrderForm } from "./order-form-fields";
import type { OrderFormFields } from "./order-form-fields";
import type { Result } from "~/result";
import { fail, succeed } from "~/result";
import { describeValue, isRecord } from "~/value-shapes";

const draftFields = ["priceKind", "lots", "limit", "reason"] as const;

function parseStoredTicketDraft(
  value: unknown,
  source: string,
): Result<OrderFormFields, string> {
  if (!isRecord(value))
    return fail(
      `${source} must be an order draft, but it is ${describeValue(value)}.`,
    );
  const fields = { ...blankOrderForm };
  const failures: string[] = [];
  for (const name of draftFields) {
    const field = value[name];
    if (typeof field !== "string")
      failures.push(
        `${source}.${name} must be text, but it is ${describeValue(field)}.`,
      );
    else if (!draftFieldFits(field))
      failures.push(
        `${source}.${name} must have at most ${String(fieldMaximumLength)} characters, but it has ${String(field.length)}.`,
      );
    else fields[name] = field;
  }
  return failures.length === 0 ? succeed(fields) : fail(failures.join("\n"));
}

export function readStoredTicketDraft(
  storage: Storage,
  key: string,
): Result<OrderFormFields | undefined, string> {
  const text = storage.getItem(key);
  if (text === null) return succeed(undefined);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return fail(
      `${key} must be an order draft in JSON, but it is invalid JSON.`,
    );
  }
  return parseStoredTicketDraft(value, key);
}

export function writeStoredTicketDraft(
  storage: Storage,
  key: string,
  fields: OrderFormFields,
): void {
  if (!draftFields.every((name) => draftFieldFits(fields[name]))) {
    storage.removeItem(key);
    return;
  }
  const saved: Record<string, string> = {};
  for (const name of draftFields) saved[name] = fields[name];
  storage.setItem(key, JSON.stringify(saved));
}

function draftFieldFits(value: string): boolean {
  return value.length <= fieldMaximumLength;
}
