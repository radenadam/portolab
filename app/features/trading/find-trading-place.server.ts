import type { RouterContextProvider } from "react-router";
import { requireUser } from "~/features/accounts/current-session.server";
import type { Role } from "~/features/accounts/accounts.schema";
import { requireTaughtClass } from "~/features/classes/taught-class.server";
import { findStudentPlace } from "./find-student-place.server";
import type { StudentPlace } from "./find-student-place.server";
import type { PortfolioOwner } from "./portfolio-store.server";

const ownerKinds: Record<Role, PortfolioOwner["kind"]> = {
  student: "membership",
  lecturer: "demonstration",
};

export interface PortfolioPageRequest {
  context: Readonly<RouterContextProvider>;
  request: Request;
  url: URL;
  params: { classId: string };
  now: Date;
}

export type TradingPlace = Omit<StudentPlace, "owner"> & {
  owner: PortfolioOwner;
};

/** Portfolio addresses fix their owner kind so a student cannot open a demonstration. */
export function findTradingPlace(
  context: Readonly<RouterContextProvider>,
  url: URL,
  {
    classId,
    kind,
  }: { classId: string; kind?: PortfolioOwner["kind"] | undefined },
): TradingPlace {
  const ownerKind = kind ?? ownerKinds[requireUser(context, url).role];
  switch (ownerKind) {
    case "membership":
      return findStudentPlace(context, url, classId);
    case "demonstration": {
      const taught = requireTaughtClass(context, url, classId);
      return {
        classId: taught.id,
        className: taught.name,
        joinedAt: taught.createdAt,
        firstSessionDate: taught.firstSessionDate,
        owner: {
          kind: "demonstration",
          classId: taught.id,
          startingCash: taught.startingCash,
        },
      };
    }
  }
}
