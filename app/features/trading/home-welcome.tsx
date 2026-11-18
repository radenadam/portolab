import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { PriceGuideCard } from "~/features/learning/price-guide-card";
import { marketPath } from "~/features/market-data/market-path";
import { formatMinutes } from "~/formatting";
import { Icon } from "~/icon";
import { isUnmodifiedClick } from "~/is-unmodified-click";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { HomeAmount } from "./home-amount";
import { HomeMapPanel } from "./home-map-panel";
import { homeOnboardingPath } from "./home-onboarding-path";
import { homeTitle } from "./home-title";
import { homeWelcomeOnboardingId } from "./onboarding";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import type { HomeWelcomeData } from "./read-home-welcome.server";
import homeStyles from "./home-portfolio.module.css";
import styles from "./home-welcome.module.css";

export function HomeWelcome({
  home,
  welcome,
  classId,
  firstName,
  onOpen,
  notice,
}: {
  home: HomePortfolioData;
  welcome: HomeWelcomeData;
  classId: ClassId;
  firstName: string;
  onOpen?: (() => void) | undefined;
  notice?: ReactNode;
}): ReactNode {
  return (
    <div className={homeStyles["home"]}>
      <h1 className={homeStyles["screenTitle"]}>{homeTitle()}</h1>
      {notice}
      <div className={homeStyles["columns"]} data-layout="columns">
        <div className={styles["left"]}>
          <section
            className={styles["welcome"]}
            aria-labelledby="home-welcome-title"
          >
            <header className={styles["greeting"]}>
              <span>
                <NumberText>
                  {(textValue) =>
                    m.trading_welcome_greeting_label({
                      name: textValue(firstName),
                    })
                  }
                </NumberText>
              </span>
              <Link
                id={homeWelcomeOnboardingId}
                className={styles["opener"]}
                to={homeOnboardingPath(classId, "cash")}
                aria-label={m.trading_welcome_open_label()}
                onClick={(event) => {
                  if (onOpen === undefined || !isUnmodifiedClick(event)) return;
                  event.preventDefault();
                  onOpen();
                }}
              >
                <span aria-hidden>?</span>
              </Link>
            </header>
            <h2 id="home-welcome-title">{m.trading_welcome_cash_title()}</h2>
            <HomeAmount amount={welcome.startingCash} />
            <p className={styles["body"]}>
              <NumberText>
                {m.trading_welcome_body({
                  delay: formatMinutes(home.delayMinutes, "long"),
                })}
              </NumberText>
            </p>
            <Link className={styles["find"]} to={marketPath(classId)}>
              <Icon name="search" className={styles["icon"]} />
              {m.trading_welcome_find_link()}
            </Link>
          </section>
          <PriceGuideCard
            guide={welcome.guide}
            classId={classId}
            className={styles["guide"]}
          />
        </div>
        <HomeMapPanel
          home={home}
          classId={classId}
          reader={{ kind: "owner", classId }}
          welcome
        />
      </div>
    </div>
  );
}
