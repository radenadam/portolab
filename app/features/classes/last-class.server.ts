import { createCookie } from "react-router";
import type { MiddlewareFunction } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readySignedInUser } from "~/features/accounts/current-session.server";
import { isLoadedByAnotherSite } from "~/is-loaded-by-another-site.server";
import { dayMilliseconds, secondMilliseconds } from "~/time-units";
import { parseRecordId } from "~/value-parsers";
import { lastClassLifetimeDays } from "./class-rules";
import { isReaderClass } from "./class-store.server";
import type { ClassId } from "./classes.schema";

const lastClassCookie = createCookie("portolab_class", {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  // A cookie counts its lifetime in seconds.
  maxAge: (lastClassLifetimeDays * dayMilliseconds) / secondMilliseconds,
});

/** The class that the browser of a request names as the one that its person opened last, or undefined when it names none. The class may since have gone away, or belong to another person who signed in on the same browser, so a caller uses it only among the classes of the person. */
export async function readLastClassId(
  request: Request,
): Promise<ClassId | undefined> {
  const value: unknown = await lastClassCookie.parse(
    request.headers.get("Cookie"),
  );
  if (value === null) {
    return undefined;
  }
  // A cookie that the browser changed names no class, and Portolab then opens the latest class of the person, as it does without the cookie.
  const classId = parseRecordId<ClassId>(
    value,
    `The cookie ${lastClassCookie.name}`,
  );
  return classId.ok ? classId.value : undefined;
}

/** Remembers the class of each page of a class that a person opens, so that Portolab opens that class when the person signs in again. A page that another site made the browser load leaves the cookie as it was, so another site cannot choose the class in which a person lands. */
export const lastClassMiddleware: MiddlewareFunction<Response> = async (
  { request, context, params },
  next,
) => {
  const response = await next();
  const classId = parseRecordId<ClassId>(params["classId"], "classId");
  const reader = readySignedInUser(context);
  if (
    !classId.ok ||
    reader === undefined ||
    isLoadedByAnotherSite(request) ||
    (await readLastClassId(request)) === classId.value ||
    !isReaderClass(context.get(databaseContext), reader, classId.value)
  ) {
    return response;
  }
  response.headers.append(
    "Set-Cookie",
    await lastClassCookie.serialize(String(classId.value)),
  );
  return response;
};
