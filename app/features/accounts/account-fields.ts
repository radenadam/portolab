import {
  characterCount,
  checkMaximumLength,
  parseFilledText,
  parseShortText,
} from "~/form-text";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";

// A name rarely comes near this, and a longer one would not fit where a page shows it.
const nameMaximumLength = 100;

/** The limits of a password that a person chooses. NIST SP 800-63B asks for at least 15 characters when a password alone signs a person in, and for a maximum of at least 64. */
export const passwordLength = { minimum: 15, maximum: 128 } as const;

/** Reads the name of a person, as the class should know it. */
export function parsePersonName(
  value: unknown,
  source: string,
): Result<string, string> {
  return parseShortText(value, source, nameMaximumLength);
}

/** Reads a password that a person chose, in the normal form that the hash reads, so that its length counts what the hash reads. */
export function parseNewPassword(
  value: unknown,
  source: string,
): Result<string, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const password = text.value.normalize("NFKC");
  const length = characterCount(password);
  if (length < passwordLength.minimum) {
    return fail(
      m.accounts_password_too_short_error({
        field: source,
        minimum: formatNumber(passwordLength.minimum),
        length: formatNumber(length),
      }),
    );
  }
  return checkMaximumLength(password, source, passwordLength.maximum);
}

/** Reads the field that repeats a new password, which must hold the same password, so that a typing mistake never locks the person out. */
export function parseRepeatedPassword(
  value: unknown,
  source: string,
  password: string,
): Result<string, string> {
  return typeof value === "string" && value.normalize("NFKC") === password
    ? succeed(password)
    : fail(m.accounts_passwords_differ_error({ field: source }));
}

/** Reads the box that a person ticks to agree to the privacy notice. */
export function parseConsent(
  value: unknown,
  source: string,
): Result<true, string> {
  return value === "yes"
    ? succeed(true)
    : fail(m.accounts_consent_missing_error({ field: source }));
}
