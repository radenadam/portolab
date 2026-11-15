import { m } from "~/paraglide/messages.js";
import { succeed } from "~/result";
import type { Result } from "~/result";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { impactShareOptions } from "./impact-shares";
import { parseOrderChoice } from "./order-form-fields";

export function parseImpactShare(
  value: unknown,
  source: string,
): Result<PortfolioWeight | undefined, string> {
  if (value === null) return succeed(undefined);
  const share = parseOrderChoice(value, source, {
    options: impactShareOptions(),
    unknownChoice: m.trading_activity_unknown_choice_error,
    longChoice: m.trading_impact_long_share_error,
  });
  return share.ok ? succeed(portfolioWeight(Number(share.value))) : share;
}
