import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { useIsInBrowser } from "~/use-is-in-browser";
import { HomePortfolio } from "./home-portfolio";
import { HomeSinceCard } from "./home-since-card";
import { HomeWelcome } from "./home-welcome";
import { HomeOnboarding } from "./home-onboarding";
import { homeOnboardingPath } from "./home-onboarding-path";
import { homeWelcomeOnboardingId } from "./onboarding";
import type { OnboardingStep } from "./onboarding";
import type { readHomePortfolio } from "./read-home-portfolio.server";

export function StudentHome({
  home,
  classId,
  firstName,
  onboarding,
  failure,
}: {
  home: ReturnType<typeof readHomePortfolio>;
  classId: ClassId;
  firstName: string;
  onboarding: OnboardingStep | undefined;
  failure?: string | undefined;
}): ReactNode {
  const inBrowser = useIsInBrowser();
  const location = useLocation();
  const navigate = useNavigate();
  const [previousLocation, setPreviousLocation] = useState(location);
  const [step, setStep] = useState(onboarding);
  const wasOpenRef = useRef(false);
  if (previousLocation !== location) {
    setPreviousLocation(location);
    setStep(onboarding);
  }
  useEffect(() => {
    if (step !== undefined) {
      wasOpenRef.current = true;
      return;
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      const target =
        document.getElementById(homeWelcomeOnboardingId) ??
        document.querySelector("main");
      target?.focus({ preventScroll: true });
    }
  }, [step]);
  const notice = (
    <HomeSinceCard
      orders={home.sinceOrders}
      now={home.now}
      classId={classId}
      failure={failure}
    />
  );
  if (home.welcome === undefined)
    return (
      <HomePortfolio
        home={home}
        classId={classId}
        reader={{ kind: "owner", classId }}
        notice={notice}
      />
    );
  if (!inBrowser && step !== undefined)
    return (
      <HomeOnboarding
        classId={classId}
        welcome={home.welcome}
        delayMinutes={home.delayMinutes}
        step={step}
        notice={notice}
      />
    );
  return (
    <>
      <HomeWelcome
        home={home}
        welcome={home.welcome}
        classId={classId}
        firstName={firstName}
        notice={step === undefined ? notice : undefined}
        onOpen={() => {
          setStep("cash");
        }}
      />
      {step !== undefined && (
        <HomeOnboarding
          classId={classId}
          welcome={home.welcome}
          delayMinutes={home.delayMinutes}
          step={step}
          notice={notice}
          actions={{
            changeStep: setStep,
            finish: () => {
              setStep(undefined);
              if (onboarding !== undefined)
                void navigate(homeOnboardingPath(classId), {
                  preventScrollReset: true,
                  replace: true,
                });
            },
          }}
        />
      )}
    </>
  );
}
