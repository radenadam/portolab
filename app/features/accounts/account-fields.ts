import {
  characterCount,
  checkMaximumLength,
  parseFilledText,
  parseShortText,
  typedText,
} from "~/form-text";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, failureOf, succeed } from "~/result";
import type { Result } from "~/result";
import type { NewStudent } from "./account-store.server";
import { isUsername, normalizeUsername, usernameLength } from "./username";
import type { Username } from "./username";

// A name rarely comes near this, and a longer one would not fit where a page shows it.
const nameMaximumLength = 100;

/** Why the fields of a form of an account were not accepted, and the text that the person typed in the fields that the form shows again. */
export interface AccountFormFailures {
  typedName: string;
  typedUsername: string;
  name: string | undefined;
  username: string | undefined;
  password: string | undefined;
  repeatedPassword: string | undefined;
  consent: string | undefined;
}

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

/** Reads a username that a person chose for a new account. */
export function parseNewUsername(
  value: unknown,
  source: string,
): Result<Username, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const username = normalizeUsername(text.value);
  return isUsername(username)
    ? succeed(username)
    : fail(
        m.accounts_username_error({
          field: source,
          value: text.value.trim(),
          minimum: formatNumber(usernameLength.minimum),
          maximum: formatNumber(usernameLength.maximum),
        }),
      );
}

/** Reads the form with which a student creates an account: a name, a username, a password typed twice, and the agreement to the privacy notice. */
export function readNewStudent(
  form: FormData,
): Result<NewStudent, AccountFormFailures> {
  const name = parsePersonName(form.get("name"), m.accounts_name_label());
  const username = parseNewUsername(
    form.get("username"),
    m.accounts_username_label(),
  );
  const password = parseNewPassword(
    form.get("newPassword"),
    m.accounts_new_password_label(),
  );
  const repeatedPassword = password.ok
    ? parseRepeatedPassword(
        form.get("repeatedPassword"),
        m.accounts_repeated_password_label(),
        password.value,
      )
    : succeed("");
  const consent = parseConsent(form.get("consent"), m.accounts_consent_label());
  if (
    name.ok &&
    username.ok &&
    password.ok &&
    repeatedPassword.ok &&
    consent.ok
  ) {
    return succeed({
      name: name.value,
      username: username.value,
      password: password.value,
    });
  }
  return fail({
    typedName: typedText(form.get("name")),
    typedUsername: typedText(form.get("username")),
    name: failureOf(name),
    username: failureOf(username),
    password: failureOf(password),
    repeatedPassword: failureOf(repeatedPassword),
    consent: failureOf(consent),
  });
}
