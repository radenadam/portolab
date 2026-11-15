import type { PortfolioOwner } from "./portfolio-store.server";

export function portfolioOwnerColumns(owner: PortfolioOwner) {
  switch (owner.kind) {
    case "membership":
      return { membershipId: owner.membershipId };
    case "demonstration":
      return { demonstrationClassId: owner.classId };
  }
}
