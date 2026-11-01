import { expect, test } from "vitest";
import { openTestDatabase } from "~/database/open-test-database.server";
import {
  checkPassword,
  createPasswordLimiters,
  signIn,
} from "./password-attempts.server";
import type {
  PasswordAttempt,
  PasswordLimiters,
} from "./password-attempts.server";
import { createTestLecturer } from "./test-accounts.server";

const now = new Date("2026-11-02T03:00:00.000Z");
const fifteenMinutesLater = new Date("2026-11-02T03:15:00.000Z");
const address = "192.0.2.1";

const wrongPassword = { ok: false, failure: { kind: "wrongPassword" } };
const usernameBlocked = {
  ok: false,
  failure: { kind: "usernameBlocked", until: fifteenMinutesLater },
};
const addressBlocked = {
  ok: false,
  failure: { kind: "addressBlocked", until: fifteenMinutesLater },
};

function attempt(username: string, password: string): PasswordAttempt {
  return { username, password, address, now };
}

/** Counts attempts of the address of the tests, as earlier wrong passwords from its network would. */
function startAddressAttempts(limiters: PasswordLimiters, count: number): void {
  for (let attempted = 0; attempted < count; attempted += 1) {
    limiters.byAddress.startAttempt(address, now);
  }
}

test("signs in with the right password, whatever the case and the spaces around the username", async () => {
  const database = openTestDatabase();
  const { account, temporaryPassword } = await createTestLecturer(
    database,
    "dosen",
  );
  expect(
    await signIn(
      database,
      createPasswordLimiters(),
      attempt("  Dosen ", temporaryPassword),
    ),
  ).toEqual({ ok: true, value: account });
});

test("fails in the same way for a wrong password and for a username without an account", async () => {
  const database = openTestDatabase();
  await createTestLecturer(database, "dosen");
  const limiters = createPasswordLimiters();
  for (const username of ["dosen", "nobody", "no"]) {
    expect(
      await signIn(database, limiters, attempt(username, "a wrong password")),
    ).toEqual(wrongPassword);
  }
});

test("blocks a username after 10 wrong passwords within 15 minutes, even when they arrive at once", async () => {
  const database = openTestDatabase();
  const { temporaryPassword } = await createTestLecturer(database, "dosen");
  const limiters = createPasswordLimiters();
  const results = await Promise.all(
    Array.from({ length: 12 }, () =>
      signIn(database, limiters, attempt("dosen", "a wrong password")),
    ),
  );
  expect(results.slice(0, 10)).toEqual(
    Array.from({ length: 10 }, () => wrongPassword),
  );
  expect(results.slice(10)).toEqual([usernameBlocked, usernameBlocked]);
  expect(
    await signIn(database, limiters, attempt("dosen", temporaryPassword)),
  ).toEqual(usernameBlocked);
  expect(
    await signIn(database, limiters, {
      ...attempt("dosen", temporaryPassword),
      now: fifteenMinutesLater,
    }),
  ).toMatchObject({ ok: true });
});

test("blocks every username from an address that reached its limit, and no other address", async () => {
  const database = openTestDatabase();
  const { temporaryPassword } = await createTestLecturer(database, "dosen");
  const limiters = createPasswordLimiters();
  startAddressAttempts(limiters, 100);
  expect(
    await signIn(database, limiters, attempt("dosen", temporaryPassword)),
  ).toEqual(addressBlocked);
  expect(
    await signIn(database, limiters, {
      ...attempt("dosen", temporaryPassword),
      address: "192.0.2.2",
    }),
  ).toMatchObject({ ok: true });
});

test("forgets the wrong passwords of a username once it signs in, and keeps counting those of its address", async () => {
  const database = openTestDatabase();
  const { temporaryPassword } = await createTestLecturer(database, "dosen");
  const limiters = createPasswordLimiters();
  for (let failure = 0; failure < 9; failure += 1) {
    await signIn(database, limiters, attempt("dosen", "a wrong password"));
  }
  await signIn(database, limiters, attempt("dosen", temporaryPassword));
  for (let failure = 0; failure < 9; failure += 1) {
    expect(
      await signIn(database, limiters, attempt("dosen", "a wrong password")),
    ).toEqual(wrongPassword);
  }
  startAddressAttempts(limiters, 82);
  expect(
    await signIn(database, limiters, attempt("dosen", temporaryPassword)),
  ).toEqual(addressBlocked);
});

test("checks the password of a person who is signed in within the same limits", async () => {
  const database = openTestDatabase();
  const { account, temporaryPassword } = await createTestLecturer(
    database,
    "dosen",
  );
  const limiters = createPasswordLimiters();
  const check = (password: string): ReturnType<typeof checkPassword> =>
    checkPassword(database, limiters, {
      ...attempt(account.username, password),
      userId: account.id,
    });
  expect(await check(temporaryPassword)).toEqual({ ok: true, value: true });
  for (let failure = 0; failure < 10; failure += 1) {
    expect(await check("a wrong password")).toEqual(wrongPassword);
  }
  expect(await check(temporaryPassword)).toEqual(usernameBlocked);
});
