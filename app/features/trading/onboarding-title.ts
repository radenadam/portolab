import { formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Rupiah } from "~/units/rupiah";
import type { OnboardingStep } from "./onboarding";

export function onboardingTitle(
  step: OnboardingStep,
  startingCash: Rupiah,
): string {
  const titles: Record<OnboardingStep, () => string> = {
    cash: () =>
      m.trading_onboarding_cash_title({
        cash: formatRupiah(startingCash, "compact"),
      }),
    impact: m.trading_onboarding_impact_title,
    help: m.trading_onboarding_help_title,
  };
  return titles[step]();
}
