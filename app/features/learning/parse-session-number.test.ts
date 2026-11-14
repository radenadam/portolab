import { expect, test } from "vitest";
import { sessionKinds } from "./content";
import { parseSessionNumber } from "./parse-session-number";

test("parses exactly the course session addresses", () => {
  for (const session of Object.keys(sessionKinds))
    expect(parseSessionNumber(session, "session")).toEqual({
      ok: true,
      value: Number(session),
    });
  for (const value of ["prices", "0", "17", "09", "9.0", "9 ", null, 9])
    expect(parseSessionNumber(value, "session").ok).toBe(false);
});
