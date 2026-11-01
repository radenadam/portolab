import type { RouterContextProvider } from "react-router";
import { clientAddressContext } from "~/client-address-context.server";
import { databaseContext } from "~/database/database.server";
import { formatMarketClock, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { findClassByJoinCode } from "./class-store.server";
import type { ClassForStudents } from "./class-store.server";
import { formatJoinCode } from "./join-code";
import type { JoinCode } from "./join-code";
import { joinLimit, joinLimiterContext } from "./join-limiter.server";
import { parseJoinCode } from "./parse-join-code.server";

/** Finds the class that a code which a person typed opens, within the limit on wrong codes from the address of the request. The failure is a sentence for the reader in the current language. */
export function findClassWithCode(
  context: Readonly<RouterContextProvider>,
  value: unknown,
): Result<{ joinCode: JoinCode; joinedClass: ClassForStudents }, string> {
  const joinCode = parseJoinCode(value, m.classes_code_label());
  if (!joinCode.ok) {
    return joinCode;
  }
  const limiter = context.get(joinLimiterContext);
  const address = context.get(clientAddressContext);
  const now = new Date();
  const blockedUntil = limiter.startAttempt(address, now);
  if (blockedUntil !== undefined) {
    return fail(
      m.classes_join_blocked_error({
        time: formatMarketClock(blockedUntil),
        failures: formatNumber(joinLimit.failures),
        minutes: formatNumber(joinLimit.windowMinutes),
      }),
    );
  }
  const joinedClass = findClassByJoinCode(
    context.get(databaseContext),
    joinCode.value,
  );
  if (joinedClass === undefined) {
    return fail(
      m.classes_unknown_code_error({ code: formatJoinCode(joinCode.value) }),
    );
  }
  limiter.takeBack(address, now);
  return succeed({ joinCode: joinCode.value, joinedClass });
}
