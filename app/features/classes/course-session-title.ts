import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { SessionNumber } from "./course-calendar";

const sessionTitles: Record<
  SessionNumber,
  { full: () => string; short?: () => string }
> = {
  1: { full: m.classes_basic_concepts_session_title },
  2: { full: m.classes_portfolio_theory_session_title },
  3: { full: m.classes_time_value_session_title },
  4: { full: m.classes_capital_market_session_title },
  5: { full: m.classes_market_instruments_session_title },
  6: { full: m.classes_trading_mechanism_session_title },
  7: { full: m.classes_proposal_review_session_title },
  8: {
    full: m.classes_midterm_exam_session_title,
    short: m.classes_midterm_label,
  },
  9: { full: m.classes_capm_session_title },
  10: { full: m.classes_portfolio_risk_session_title },
  11: { full: m.classes_futures_session_title },
  12: { full: m.classes_mutual_funds_session_title },
  13: { full: m.classes_options_session_title },
  14: { full: m.classes_bonds_session_title },
  15: { full: m.classes_article_review_session_title },
  16: {
    full: m.classes_final_exam_session_title,
    short: m.classes_final_label,
  },
};

export function courseSessionTitle(
  session: SessionNumber,
  length: "full" | "short" = "full",
): string {
  const title = sessionTitles[session];
  const titles: Record<typeof length, () => string> = {
    full: title.full,
    short: () =>
      title.short?.() ??
      m.classes_numbered_session_label({ session: formatNumber(session) }),
  };
  return titles[length]();
}
