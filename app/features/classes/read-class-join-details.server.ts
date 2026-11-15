import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { addressesForOthers } from "~/local-network.server";
import type { ClassId } from "./classes.schema";
import { findTaughtClass } from "./class-store.server";
import { formatJoinCode, joinPath } from "./join-code";

/** The join chip follows the workspace on every page, so its private details belong in the frame loader. */
export function readClassJoinDetails(
  context: Readonly<RouterContextProvider>,
  classId: ClassId,
  url: URL,
) {
  const user = requireUser(context, url);
  if (user.role !== "lecturer") return undefined;
  const taught = findTaughtClass(
    context.get(databaseContext),
    classId,
    user.id,
  );
  if (taught === undefined) return undefined;
  const joinCode = formatJoinCode(taught.joinCode);
  return {
    joinCode,
    startingCash: taught.startingCash,
    joinAddresses: addressesForOthers(new URL(joinPath(joinCode), url)),
  };
}
