import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { pathWithQuery } from "~/path-with-query";
import { homeWelcomeOnboardingId } from "./onboarding";
import type { OnboardingStep } from "./onboarding";

/** Native onboarding returns to the same welcome control, as decision 0030 requires. */
export function homeOnboardingPath(
  classId: ClassId,
  step?: OnboardingStep,
): string {
  return step === undefined
    ? `${classPath(classId)}#${homeWelcomeOnboardingId}`
    : pathWithQuery(classPath(classId), { welcome: step });
}
