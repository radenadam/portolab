import { expect, test } from "vitest";
import { formMaximumBytes } from "~/form-size";
import { bodyFitsWithin } from "~/form-size-limit.server";
import { returnPathMaximumLength } from "~/parse-return-path";
import { nameMaximumLength, passwordLength } from "./account-limits";

test("sends the form that finishes an account within the limit of a request body, with every field at its maximum length in the characters that take the most bytes", async () => {
  // This form holds the most text of any form of Portolab: the path to return to, a name, and a password twice. A form escapes each byte of a character outside the basic plane of Unicode as three bytes.
  const widestCharacter = "𝒜";
  const password = widestCharacter.repeat(passwordLength.maximum);
  const form = new URLSearchParams({
    returnTo: widestCharacter.repeat(returnPathMaximumLength),
    name: widestCharacter.repeat(nameMaximumLength),
    newPassword: password,
    repeatedPassword: password,
    consent: "yes",
  });
  const request = new Request("http://localhost:3000/account/setup", {
    method: "POST",
    body: form,
  });
  expect(await bodyFitsWithin(request, formMaximumBytes)).toBe(true);
});
