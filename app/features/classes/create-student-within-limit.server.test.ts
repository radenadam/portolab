import { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { findAccountByUsername } from "~/features/accounts/account-store.server";
import type { NewStudent } from "~/features/accounts/account-store.server";
import { parseUsername } from "~/features/accounts/username";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { createStudentWithinLimit } from "./create-student-within-limit.server";
import {
  createJoinLimiters,
  joinLimitersContext,
} from "./join-limiters.server";
import type { JoinLimiters } from "./join-limiters.server";

const network = "192.0.2.1";
// 10.00 WIB on Monday 2 November 2026, so a block that the first request starts ends at 10.15 WIB.
const now = new Date("2026-11-02T03:00:00.000Z");

const blockedTexts: Record<Locale, string> = {
  id: "Portolab tidak membuat akun dari jaringan Anda sampai 10.15 WIB, karena menerima 200 permintaan akun baru dari jaringan itu dalam 15 menit. Batas ini mencegah siapa pun membanjiri sebuah kelas dengan akun. Coba lagi setelah waktu tersebut, atau bergabunglah melalui jaringan lain, seperti data seluler ponsel Anda.",
  en: "Portolab creates no account from your network until 10:15 AM WIB, because it received 200 requests for a new account from it within 15 minutes. The limit stops anyone from flooding a class with accounts. Try again after that time, or join through another network, such as the mobile data of your phone.",
};

/** The context that the server gives to an action, with the database, new limits on joining, and the address of one network. */
function contextFor(
  database: Database,
  limiters: JoinLimiters,
): RouterContextProvider {
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  context.set(joinLimitersContext, limiters);
  context.set(clientAddressContext, network);
  return context;
}

function newStudent(usernameText: string): NewStudent {
  const username = parseUsername(usernameText, "The username of the test");
  if (!username.ok) {
    throw new Error(username.failure);
  }
  return {
    username: username.value,
    name: "Sari Dewi",
    password: "teh sore di taman",
  };
}

test("creates the account of a student, and refuses a username that is taken", async () => {
  const database = openDatabaseForTest();
  const context = contextFor(database, createJoinLimiters());
  const sari = newStudent("sari");
  const created = await createStudentWithinLimit(context, sari, now);
  expect(created).toEqual({
    ok: true,
    value: findAccountByUsername(database, sari.username)?.id,
  });
  expect(await createStudentWithinLimit(context, sari, now)).toEqual({
    ok: false,
    failure: { kind: "usernameTaken" },
  });
});

test("counts every request against the limit of the network, also one whose username is taken", async () => {
  const database = openDatabaseForTest();
  const limiters = createJoinLimiters();
  const context = contextFor(database, limiters);
  await createStudentWithinLimit(context, newStudent("sari"), now);
  await createStudentWithinLimit(context, newStudent("sari"), now);
  // The test counts the other requests directly, because creating each account would take the time of a hash.
  for (let request = 2; request < 199; request += 1) {
    limiters.newAccounts.startAttempt(network, now);
  }
  expect(
    await createStudentWithinLimit(context, newStudent("budi"), now),
  ).toMatchObject({ ok: true });
  const dewi = newStudent("dewi");
  expect(await createStudentWithinLimit(context, dewi, now)).toMatchObject({
    ok: false,
    failure: { kind: "blocked" },
  });
  expect(findAccountByUsername(database, dewi.username)).toBeUndefined();
});

for (const locale of locales) {
  test(`explains the block of a network that reached the limit on new accounts in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const database = openDatabaseForTest();
    const limiters = createJoinLimiters();
    for (let request = 0; request < 200; request += 1) {
      limiters.newAccounts.startAttempt(network, now);
    }
    expect(
      await createStudentWithinLimit(
        contextFor(database, limiters),
        newStudent("sari"),
        now,
      ),
    ).toEqual({
      ok: false,
      failure: { kind: "blocked", text: blockedTexts[locale] },
    });
  });
}
