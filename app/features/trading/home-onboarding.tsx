import { useEffect, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Link } from "react-router";
import { PageTitle } from "~/page-title";
import { onboardingTitle } from "./onboarding-title";
import { AppIcon } from "~/app-icon";
import type { ClassId } from "~/features/classes/classes.schema";
import { formatMinutes, formatNumber } from "~/formatting";
import { NumberText } from "~/number-text";
import { isUnmodifiedClick } from "~/is-unmodified-click";
import { m } from "~/paraglide/messages.js";
import { onboardingSteps } from "./onboarding";
import type { OnboardingStep } from "./onboarding";
import { homeOnboardingPath } from "./home-onboarding-path";
import type { HomeWelcomeData } from "./read-home-welcome.server";
import { HomeOnboardingVisual } from "./home-onboarding-visual";
import styles from "./home-onboarding.module.css";

interface OnboardingActions {
  changeStep: (step: OnboardingStep) => void;
  finish: () => void;
}

export function HomeOnboarding({
  classId,
  welcome,
  delayMinutes,
  step,
  actions,
  notice,
}: {
  classId: ClassId;
  welcome: HomeWelcomeData;
  delayMinutes: number;
  step: OnboardingStep;
  actions?: OnboardingActions;
  notice?: ReactNode;
}): ReactNode {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nextRef = useRef<HTMLAnchorElement>(null);
  const enhanced = actions !== undefined;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
    };
  }, [enhanced]);
  useEffect(() => {
    if (enhanced) {
      const failure =
        dialogRef.current?.querySelector<HTMLElement>('[role="alert"] a');
      (failure ?? nextRef.current)?.focus({ preventScroll: true });
    }
  }, [step, enhanced]);
  const index = onboardingSteps.indexOf(step);
  const previous = onboardingSteps[index - 1];
  const next = onboardingSteps[index + 1];
  const descriptions: Record<OnboardingStep, () => string> = {
    cash: () =>
      m.trading_welcome_body({ delay: formatMinutes(delayMinutes, "long") }),
    impact: m.trading_onboarding_impact_body,
    help: m.trading_onboarding_help_body,
  };
  function follow(
    event: MouseEvent<HTMLAnchorElement>,
    target: OnboardingStep | undefined,
  ) {
    if (actions === undefined || !isUnmodifiedClick(event)) return;
    event.preventDefault();
    if (target === undefined) dialogRef.current?.close();
    else actions.changeStep(target);
  }
  const content = (
    <div className={styles["inner"]}>
      {enhanced && (
        <PageTitle text={onboardingTitle(step, welcome.startingCash)} />
      )}
      <header className={styles["header"]}>
        <span className={styles["brand"]}>
          <span className={styles["icon"]}>
            <AppIcon />
          </span>
          {m.app_name()}
        </span>
        <Link
          className={styles["skip"]}
          to={homeOnboardingPath(classId)}
          onClick={(event) => {
            follow(event, undefined);
          }}
        >
          {m.trading_onboarding_skip_label()}
        </Link>
      </header>
      <div className={styles["visual"]}>
        <HomeOnboardingVisual
          step={step}
          welcome={welcome}
          delayMinutes={delayMinutes}
        />
      </div>
      <div className={styles["description"]}>
        <div className={styles["dots"]} aria-hidden>
          {onboardingSteps.map((item) => (
            <span key={item} data-current={item === step || undefined} />
          ))}
        </div>
        <h1 id="home-onboarding-title">
          <NumberText>{onboardingTitle(step, welcome.startingCash)}</NumberText>
        </h1>
        {notice}
        <p>
          <NumberText>{descriptions[step]()}</NumberText>
        </p>
        <p className={styles["srOnly"]} aria-live="polite">
          <NumberText>
            {m.trading_onboarding_progress_notice({
              step: formatNumber(index + 1),
              total: formatNumber(onboardingSteps.length),
            })}
          </NumberText>
        </p>
      </div>
      <nav
        className={styles["actions"]}
        aria-label={m.trading_onboarding_navigation_label()}
      >
        {previous !== undefined && (
          <Link
            className={styles["back"]}
            to={homeOnboardingPath(classId, previous)}
            onClick={(event) => {
              follow(event, previous);
            }}
          >
            {m.trading_onboarding_back_label()}
          </Link>
        )}
        <Link
          ref={nextRef}
          className={styles["next"]}
          to={homeOnboardingPath(classId, next)}
          onClick={(event) => {
            follow(event, next);
          }}
        >
          {next === undefined
            ? m.trading_onboarding_start_label()
            : m.trading_onboarding_next_label()}
        </Link>
      </nav>
    </div>
  );
  if (actions === undefined)
    return (
      <section
        className={styles["page"]}
        aria-labelledby="home-onboarding-title"
      >
        {content}
      </section>
    );
  return (
    <dialog
      ref={dialogRef}
      className={styles["dialog"]}
      aria-labelledby="home-onboarding-title"
      onCancel={(event) => {
        event.preventDefault();
        event.currentTarget.close();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) actions.finish();
      }}
    >
      {content}
    </dialog>
  );
}
