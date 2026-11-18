import { checkFieldLengthForReader } from "~/form-text";
import { succeed } from "~/result";
import type { Result } from "~/result";
import { parseChoice } from "~/value-parsers";
import { onboardingSteps } from "./onboarding";
import type { OnboardingStep } from "./onboarding";

export function parseOnboardingStep(
  value: unknown,
  source: string,
): Result<OnboardingStep | undefined, string> {
  if (value === null) return succeed(undefined);
  if (typeof value === "string") {
    const bounded = checkFieldLengthForReader(value, source);
    if (!bounded.ok) return bounded;
  }
  return parseChoice(value, source, onboardingSteps);
}
