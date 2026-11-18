import { countedText } from "~/counted-text";
import { m } from "~/paraglide/messages.js";

export function homeWelcomeInsight(
  classmateCount: number,
  mapAvailable: boolean,
) {
  const condition = mapAvailable
    ? ""
    : m.trading_welcome_map_requirement_part();
  return {
    session: 2 as const,
    topic: m.trading_welcome_portfolio_label(),
    text:
      classmateCount === 0
        ? m.trading_welcome_no_classmates_body({ condition })
        : countedText(
            classmateCount,
            {
              one: m.trading_welcome_one_classmate_body,
              several: m.trading_welcome_several_classmates_body,
            },
            { condition },
          ),
  };
}
