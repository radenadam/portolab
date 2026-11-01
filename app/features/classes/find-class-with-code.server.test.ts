import { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { openTestDatabase } from "~/database/open-test-database.server";
import { createReadyTestLecturer } from "~/features/accounts/test-accounts.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { createClass, findTaughtClass } from "./class-store.server";
import { findClassWithCode } from "./find-class-with-code.server";
import { formatJoinCode, joinPath } from "./join-code";
import type { JoinCode } from "./join-code";
import { createJoinLimiter, joinLimiterContext } from "./join-limiter.server";

const texts: Record<
  Locale,
  {
    empty: string;
    malformed: string;
    unknown: string;
    blocked: readonly [string, string];
  }
> = {
  id: {
    empty: 'Isi kolom "Kode kelas".',
    malformed:
      'Kode kelas terdiri dari 8 huruf dan angka, tetapi "k7qm-4rx1" bukan kode seperti itu. Periksa kodenya dengan dosen Anda.',
    unknown:
      "Tidak ada kelas dengan kode aaaa-aaaa. Periksa kodenya dengan dosen Anda, lalu coba lagi.",
    blocked: [
      "Portolab memblokir kode dari jaringan Anda sampai ",
      " WIB, karena menerima 100 kode salah dari jaringan itu dalam 15 menit. Blokir ini menghentikan siapa pun yang mencoba menebak kode kelas. Coba lagi setelah waktu tersebut.",
    ],
  },
  en: {
    empty: 'Fill in the field "Code of the class".',
    malformed:
      'The code of a class has 8 letters and digits, but "k7qm-4rx1" is not such a code. Check the code with your lecturer.',
    unknown:
      "No class has the code aaaa-aaaa. Check the code with your lecturer and try again.",
    blocked: [
      "Portolab blocks codes from your network until ",
      " WIB, because it received 100 wrong codes from it within 15 minutes. The block stops anyone who tries to guess the code of a class. Try again after that time.",
    ],
  },
};

/** The context that the server gives to a loader, with the database, a new limit on codes, and the address of one network. */
function contextFor(database: Database): RouterContextProvider {
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  context.set(joinLimiterContext, createJoinLimiter());
  context.set(clientAddressContext, "192.0.2.1");
  return context;
}

async function createTestClass(database: Database): Promise<JoinCode> {
  const lecturerId = await createReadyTestLecturer(
    database,
    "dosen",
    "Budi Santoso",
  );
  const classId = createClass(
    database,
    {
      lecturerId,
      name: "Manajemen Portofolio A",
      startingCash: rupiah(100_000_000),
    },
    new Date("2026-11-02T03:00:00.000Z"),
  );
  const taught = findTaughtClass(database, classId, lecturerId);
  if (taught === undefined) {
    throw new Error("The test could not create its class.");
  }
  return taught.joinCode;
}

test("finds the class of a code whatever its case, its spaces, and its hyphen", async () => {
  const database = openTestDatabase();
  const joinCode = await createTestClass(database);
  const context = contextFor(database);
  for (const typed of [
    joinCode,
    formatJoinCode(joinCode).toUpperCase(),
    ` ${joinCode.slice(0, 4)} ${joinCode.slice(4)} `,
  ]) {
    expect(findClassWithCode(context, typed), typed).toMatchObject({
      ok: true,
      value: { joinCode, joinedClass: { name: "Manajemen Portofolio A" } },
    });
  }
  expect(joinPath(joinCode)).toBe(`/join/${formatJoinCode(joinCode)}`);
  expect(formatJoinCode(joinCode)).toMatch(
    /^[a-km-np-z2-9]{4}-[a-km-np-z2-9]{4}$/,
  );
});

for (const locale of locales) {
  const text = texts[locale];

  test(`explains a code that is empty, malformed, or opens no class in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const database = openTestDatabase();
    await createTestClass(database);
    const context = contextFor(database);
    expect(findClassWithCode(context, "")).toEqual({
      ok: false,
      failure: text.empty,
    });
    expect(findClassWithCode(context, "k7qm-4rx1")).toEqual({
      ok: false,
      failure: text.malformed,
    });
    expect(findClassWithCode(context, "AAAA AAAA")).toEqual({
      ok: false,
      failure: text.unknown,
    });
  });

  test(`blocks the codes of a network after 100 wrong ones, and counts no right one, in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const database = openTestDatabase();
    const joinCode = await createTestClass(database);
    const context = contextFor(database);
    for (let attempt = 0; attempt < 99; attempt += 1) {
      findClassWithCode(context, "aaaa-aaaa");
      findClassWithCode(context, joinCode);
    }
    expect(findClassWithCode(context, "aaaa-aaaa")).toEqual({
      ok: false,
      failure: text.unknown,
    });
    const blocked = findClassWithCode(context, joinCode);
    const failure = blocked.ok ? "" : blocked.failure;
    const [start, end] = text.blocked;
    expect(failure.startsWith(start) && failure.endsWith(end), failure).toBe(
      true,
    );
  });
}
