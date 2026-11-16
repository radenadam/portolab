import { m } from "~/paraglide/messages.js";

export function portfolioLabel(studentName: string | undefined): string {
  return studentName === undefined
    ? m.trading_home_portfolio_label()
    : m.trading_home_student_portfolio_label({ name: studentName });
}
