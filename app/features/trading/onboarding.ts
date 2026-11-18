export const onboardingSteps = ["cash", "impact", "help"] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];

export const onboardingHistoryRange = "3m";

export const homeWelcomeOnboardingId = "home-welcome-onboarding";
