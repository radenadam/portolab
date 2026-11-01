import { scryptSync } from "node:crypto";
import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "./password.server";
import type { PasswordHash } from "./password.server";

test("hashes a password with scrypt in the PHC string format, with the parameters that it used", async () => {
  const passwordHash = await hashPassword("kopi pagi di kampus");
  expect(passwordHash).toMatch(
    /^\$scrypt\$ln=15,r=8,p=3\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]{43}$/,
  );
});

test("accepts the password of a hash and rejects any other", async () => {
  const passwordHash = await hashPassword("kopi pagi di kampus");
  expect(await verifyPassword("kopi pagi di kampus", passwordHash)).toBe(true);
  expect(await verifyPassword("kopi pagi di kampus ", passwordHash)).toBe(
    false,
  );
  expect(await verifyPassword("Kopi pagi di kampus", passwordHash)).toBe(false);
});

test("salts each hash, so the same password never gives the same hash", async () => {
  expect(await hashPassword("kopi pagi di kampus")).not.toBe(
    await hashPassword("kopi pagi di kampus"),
  );
});

test("accepts a letter that a keyboard writes as one code point or as two", async () => {
  const composed = "kopi pagi di caf\u00e9";
  const decomposed = "kopi pagi di cafe\u0301";
  expect(await verifyPassword(decomposed, await hashPassword(composed))).toBe(
    true,
  );
});

test("checks a hash with the parameters that it names, so a hash made with other parameters still works", async () => {
  // Node computes this hash directly with smaller parameters than hashPassword uses.
  const salt = Buffer.from("a salt of sixteen");
  const key = scryptSync("kopi pagi di kampus", salt, 32, {
    N: 2 ** 10,
    r: 8,
    p: 1,
  });
  const unpadded = (bytes: Buffer): string =>
    bytes.toString("base64").replace(/=+$/, "");
  const olderHash =
    `$scrypt$ln=10,r=8,p=1$${unpadded(salt)}$${unpadded(key)}` as PasswordHash;
  expect(await verifyPassword("kopi pagi di kampus", olderHash)).toBe(true);
  expect(await verifyPassword("another password", olderHash)).toBe(false);
});

test("fails loudly on a stored hash in another format, which only a broken database holds", async () => {
  await expect(
    verifyPassword("kopi pagi di kampus", "plain text" as PasswordHash),
  ).rejects.toThrow(
    "A stored password hash is not in the format that hashPassword writes.",
  );
});
