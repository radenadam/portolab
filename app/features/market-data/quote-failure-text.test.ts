import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { minutesAfter } from "~/time-units";
import { attemptForCodes, missingQuoteText } from "./quote-failure-text";
import {
  attemptInStateForTest,
  sessionStateForTest,
  halfMinuteAfterForTest,
  nextAttemptSentencesForTest,
  nextAttemptTimeForTest,
  scheduleStatesForTest,
} from "./schedule-states-for-test";
import type { UpdateAttempt } from "./update-attempts.server";

const delayMinutes = 10;

test("narrows an attempt to the prices of the given codes that it could not update, and keeps everything else", () => {
  const attempt: UpdateAttempt = {
    attemptedAt: new Date("2026-11-02T03:00:00.000Z"),
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: ["BBRI", "TLKM", "WIFI"],
  };
  expect(attemptForCodes(attempt, ["WIFI", "BBCA", "TLKM"])).toEqual({
    ...attempt,
    failedCodes: ["TLKM", "WIFI"],
  });
  expect(attemptForCodes(attempt, ["BBCA"])).toEqual({
    ...attempt,
    failedCodes: [],
  });
  expect(attemptForCodes(undefined, ["BBCA"])).toBeUndefined();
});

const failedAtTen: Record<Locale, string> = {
  id: "Portolab belum memiliki harga WIFI, karena percobaan terakhir untuk mengambilnya pada 2 Nov 2026, 10.00 WIB gagal.",
  en: "Portolab has no price for WIFI yet, because its latest attempt to fetch it at Nov 2, 2026, 10:00 AM WIB failed.",
};

// The kinds of attempt after which Portolab has no price of WIFI, each narrowed to WIFI, with the sentences before the time of the next attempt after an attempt at 10:00 WIB on Monday 2 November 2026. An answer that did not ask for WIFI comes, for example, before WIFI joined the stocks that Portolab tracks. A failed attempt updated no price, but WIFI has none that the screen shows, so the text speaks only of WIFI.
const kinds: readonly {
  name: string;
  succeeded: boolean;
  failedCodes: string[];
  sentence: Record<Locale, string>;
}[] = [
  {
    name: "an answer that lacked it",
    succeeded: true,
    failedCodes: ["WIFI"],
    sentence: failedAtTen,
  },
  {
    name: "three failures in a row",
    succeeded: false,
    failedCodes: ["WIFI"],
    sentence: failedAtTen,
  },
  {
    name: "an answer that did not ask for it",
    succeeded: true,
    failedCodes: [],
    sentence: {
      id: "Portolab belum memiliki harga WIFI.",
      en: "Portolab has no price for WIFI yet.",
    },
  },
];

const tryingNow: Record<Locale, string> = {
  id: "Portolab sedang mencoba lagi sekarang.",
  en: "Portolab is trying again now.",
};

const firstPrices: Record<Locale, string> = {
  id: "Portolab sedang mengambil harga pertamanya. Muat ulang halaman ini sebentar lagi untuk melihatnya.",
  en: "Portolab is fetching its first prices now. Reload this page in a moment to see them.",
};

for (const locale of locales) {
  const language = languageNames[locale];

  test(`says why Portolab has no price of a stock after each kind of attempt, and when the job tries again or that it is trying now, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const kind of kinds) {
      const attempt = attemptInStateForTest(sessionStateForTest, kind);
      const sentence = kind.sentence[locale];
      const nextTime = nextAttemptTimeForTest(
        sessionStateForTest,
        kind.succeeded,
        locale,
      );
      expect(
        missingQuoteText("WIFI", attempt, {
          now: halfMinuteAfterForTest(sessionStateForTest),
          delayMinutes,
        }),
        kind.name,
      ).toBe(`${sentence} ${nextAttemptSentencesForTest[locale](nextTime)}`);
      // Four minutes after the attempt, the job has reached the time of the next attempt after each kind, which is latest after three failures in a row.
      expect(
        missingQuoteText("WIFI", attempt, {
          now: minutesAfter(new Date(sessionStateForTest.attemptedAt), 4),
          delayMinutes,
        }),
        kind.name,
      ).toBe(`${sentence} ${tryingNow[locale]}`);
    }
  });

  test(`says that the job is fetching the first prices while it has made no attempt, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      missingQuoteText("WIFI", undefined, {
        now: new Date("2026-11-02T03:00:00.000Z"),
        delayMinutes,
      }),
    ).toBe(firstPrices[locale]);
  });

  for (const kind of kinds) {
    for (const state of scheduleStatesForTest) {
      test(`says when the job tries again after ${kind.name} ${state.name} in ${language}`, () => {
        switchLocaleForTest(locale);
        expect(
          missingQuoteText("WIFI", attemptInStateForTest(state, kind), {
            now: halfMinuteAfterForTest(state),
            delayMinutes,
          }),
        ).toContain(
          nextAttemptSentencesForTest[locale](
            nextAttemptTimeForTest(state, kind.succeeded, locale),
          ),
        );
      });
    }
  }
}
