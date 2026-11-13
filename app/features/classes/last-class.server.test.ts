import type { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import {
  createTestStudent,
  readerContextForTest,
} from "~/features/accounts/accounts-for-test.server";
import { joinClass } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import {
  createClassForTest,
  createLecturerWithClassForTest,
} from "./classes-for-test.server";
import { lastClassLifetimeDays } from "./class-rules";
import { lastClassMiddleware, readLastClassId } from "./last-class.server";

const now = new Date("2026-11-02T03:00:00.000Z");

/** The headers with which a browser asks for a page that its reader opened, or that another site made it load in a frame. */
const openedByReader = {
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-User": "?1",
};
const loadedByAnotherSite = {
  "Sec-Fetch-Site": "cross-site",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Dest": "iframe",
};

/** Opens a page of an address through the middleware, with the cookie that a browser sends, and returns the cookie that the answer gives back, if any. */
async function openPage(
  context: RouterContextProvider,
  {
    path,
    params,
    cookie = "",
    headers = openedByReader,
  }: {
    path: string;
    params: Record<string, string>;
    cookie?: string;
    headers?: Record<string, string>;
  },
): Promise<string | undefined> {
  const url = new URL(path, "http://localhost");
  const request = new Request(url, { headers: { ...headers, Cookie: cookie } });
  const response = await lastClassMiddleware(
    { request, url, params, pattern: path, context },
    () => Promise.resolve(new Response("the page")),
  );
  if (!(response instanceof Response)) {
    throw new Error("The middleware answered without a response.");
  }
  const [setCookie] = response.headers.getSetCookie();
  return setCookie;
}

/** The value of the Cookie header with which a browser sends back a cookie that a Set-Cookie header gave it. */
function cookieOf(setCookie: string | undefined): string {
  return setCookie?.split(";")[0] ?? "";
}

function contextOf(
  database: Database,
  userId: UserId | undefined,
): RouterContextProvider {
  return readerContextForTest(
    database,
    userId === undefined ? undefined : { userId, now },
  );
}

async function classWithStudent(database: Database): Promise<{
  lecturerId: UserId;
  studentId: UserId;
  classId: ClassId;
}> {
  const { lecturerId, classId } =
    await createLecturerWithClassForTest(database);
  const studentId = await createTestStudent(database, "sari", "Sari Wulandari");
  joinClass(database, { classId, studentId }, now);
  return { lecturerId, studentId, classId };
}

test("remembers the class of a page that its student or its lecturer opens for the days that the privacy notice states, and reads it back from the cookie", async () => {
  const database = openDatabaseForTest();
  const { lecturerId, studentId, classId } = await classWithStudent(database);
  for (const userId of [studentId, lecturerId]) {
    const setCookie = await openPage(contextOf(database, userId), {
      path: `/classes/${String(classId)}/market`,
      params: { classId: String(classId) },
    });
    expect(setCookie).toMatch(
      new RegExp(
        `^portolab_class=[^;]+; Max-Age=${String(lastClassLifetimeDays * 24 * 60 * 60)}; Path=/; HttpOnly; SameSite=Lax$`,
      ),
    );
    expect(
      await readLastClassId(
        new Request("http://localhost/", {
          headers: { Cookie: cookieOf(setCookie) },
        }),
      ),
    ).toBe(classId);
  }
});

test("leaves the cookie as it was for a class of another person, for a visitor, for a page outside a class, for a page that another site made the browser load, and for the class that the cookie already names", async () => {
  const database = openDatabaseForTest();
  const { lecturerId, studentId, classId } = await classWithStudent(database);
  const otherClass = createClassForTest(database, lecturerId, "Kelas B");
  const path = `/classes/${String(classId)}`;
  const params = { classId: String(classId) };
  const student = contextOf(database, studentId);
  const remembered = await openPage(student, { path, params });
  expect(remembered).toBeDefined();
  for (const [context, page] of [
    [
      student,
      {
        path: `/classes/${String(otherClass.classId)}`,
        params: { classId: String(otherClass.classId) },
      },
    ],
    [contextOf(database, undefined), { path, params }],
    [student, { path: "/account", params: {} }],
    [student, { path, params, headers: loadedByAnotherSite }],
    [student, { path, params, cookie: cookieOf(remembered) }],
  ] as const) {
    expect(await openPage(context, page), page.path).toBeUndefined();
  }
});

test("reads no class from a request without the cookie or with a cookie that the browser changed", async () => {
  for (const cookie of [
    "",
    "portolab_class=garbage",
    "portolab_class=Ijxyb2tlbiI%3D",
  ]) {
    expect(
      await readLastClassId(
        new Request("http://localhost/", { headers: { Cookie: cookie } }),
      ),
      cookie,
    ).toBeUndefined();
  }
});
