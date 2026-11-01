import type { RouterContextProvider } from "react-router";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import { formatMarketClock, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { findClassByJoinCode } from "./class-store.server";
import type { ClassForStudents } from "./class-store.server";
import { formatJoinCode } from "./join-code";
import type { JoinCode } from "./join-code";
import { joinLimits, joinLimitersContext } from "./join-limiters.server";
import { parseJoinCode } from "./parse-join-code.server";

/** Why a code opens no class: a sentence for the reader in the current language, with the status of the answer, which is 429 when the network reached the limit on wrong codes. */
export interface CodeFailure {
  text: string;
  status: 400 | 429;
}

/** Finds the class that a code which a person typed opens, within the limit on wrong codes from the address of the request. */
export function findClassWithCode(
  context: Readonly<RouterContextProvider>,
  value: unknown,
): Result<{ joinCode: JoinCode; joinedClass: ClassForStudents }, CodeFailure> {
  const joinCode = parseJoinCode(value, m.classes_code_label());
  if (!joinCode.ok) {
    return fail({ text: joinCode.failure, status: 400 });
  }
  const limiter = context.get(joinLimitersContext).wrongCodes;
  const address = context.get(clientAddressContext);
  const now = new Date();
  const blockedUntil = limiter.startAttempt(address, now);
  if (blockedUntil !== undefined) {
    return fail({
      text: m.classes_join_blocked_error({
        time: formatMarketClock(blockedUntil),
        failures: formatNumber(joinLimits.wrongCodes.failures),
        minutes: formatNumber(joinLimits.wrongCodes.windowMinutes),
      }),
      status: 429,
    });
  }
  const joinedClass = findClassByJoinCode(
    context.get(databaseContext),
    joinCode.value,
  );
  if (joinedClass === undefined) {
    return fail({
      text: m.classes_unknown_code_error({
        code: formatJoinCode(joinCode.value),
      }),
      status: 400,
    });
  }
  limiter.takeBack(address, now);
  return succeed({ joinCode: joinCode.value, joinedClass });
}
