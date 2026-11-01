import { RouterContextProvider } from "react-router";
import { expect, onTestFinished, test, vi } from "vitest";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { createReadyTestLecturer } from "~/features/accounts/accounts-for-test.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { createClass, findTaughtClass } from "./class-store.server";
import { findClassWithCode } from "./find-class-with-code.server";
import { formatJoinCode, joinPath } from "./join-code";
import type { JoinCode } from "./join-code";
import {
  createJoinLimiters,
  joinLimitersContext,
} from "./join-limiters.server";

const texts: Record<
  Locale,
  {
    empty: string;
    malformed: string;
    unknown: string;
    blocked: string;
  }
> = {
  id: {
    empty:
      'Kolom "Kode kelas" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
    malformed:
      'Kolom "Kode kelas" berisi kode kelas, yang terdiri dari 8 huruf dan angka, tetapi isinya "k7qm-4rx1". Periksa kodenya dengan dosen Anda.',
    unknown:
      'Kolom "Kode kelas" berisi kode "aaaa-aaaa", tetapi tidak ada kelas dengan kode ini. Periksa kodenya dengan dosen Anda, lalu coba lagi.',
    blocked:
      "Portolab memblokir kode dari jaringan Anda sampai 10.15 WIB, karena menerima 100 kode salah dari jaringan itu dalam 15 menit. Blokir ini menghentikan siapa pun yang mencoba menebak kode kelas. Coba lagi setelah waktu tersebut.",
  },
  en: {
    empty:
      'The field "Code of the class" is empty, but Portolab needs it. Fill it in.',
    malformed:
      'The field "Code of the class" takes the code of a class, which has 8 letters and digits, but it holds "k7qm-4rx1". Check the code with your lecturer.',
    unknown:
      'The field "Code of the class" holds the code "aaaa-aaaa", but no class has this code. Check the code with your lecturer and try again.',
    blocked:
      "Portolab blocks codes from your network until 10:15 AM WIB, because it received 100 wrong codes from it within 15 minutes. The block stops anyone who tries to guess the code of a class. Try again after that time.",
  },
};

/** The context that the server gives to a loader, with the database, a new limit on codes, and the address of one network. */
function contextFor(database: Database): RouterContextProvider {
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  context.set(joinLimitersContext, createJoinLimiters());
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
  const database = openDatabaseForTest();
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
    const database = openDatabaseForTest();
    await createTestClass(database);
    const context = contextFor(database);
    expect(findClassWithCode(context, "")).toEqual({
      ok: false,
      failure: { kind: "wrongCode", text: text.empty, status: 400 },
    });
    expect(findClassWithCode(context, "k7qm-4rx1")).toEqual({
      ok: false,
      failure: { kind: "wrongCode", text: text.malformed, status: 400 },
    });
    expect(findClassWithCode(context, "AAAA AAAA")).toEqual({
      ok: false,
      failure: { kind: "wrongCode", text: text.unknown, status: 400 },
    });
  });

  test(`blocks the codes of a network after 100 wrong ones, and counts no right one, in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const database = openDatabaseForTest();
    const joinCode = await createTestClass(database);
    const context = contextFor(database);
    // 10.00 WIB, so the block that the first wrong code starts ends at 10.15 WIB.
    vi.useFakeTimers({ now: new Date("2026-11-02T03:00:00.000Z") });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    for (let attempt = 0; attempt < 99; attempt += 1) {
      findClassWithCode(context, "aaaa-aaaa");
      findClassWithCode(context, joinCode);
    }
    expect(findClassWithCode(context, "aaaa-aaaa")).toEqual({
      ok: false,
      failure: { kind: "wrongCode", text: text.unknown, status: 400 },
    });
    expect(findClassWithCode(context, joinCode)).toEqual({
      ok: false,
      failure: { kind: "blocked", text: text.blocked, status: 429 },
    });
  });
}
