import { countedText } from "~/counted-text";
import type { CountedMessages } from "~/counted-text";
import { formatList, formatMarketTime } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Quote } from "./price-source.server";
import type { UpdateAttempt } from "./update-attempts.server";
import { nextScheduledAttempt } from "./update-schedule";

/** The latest attempt of the quote job with only the given codes among the prices that it could not update, which a screen that shows only the prices of those codes passes to quoteFailureText. */
export function attemptForCodes(
  attempt: UpdateAttempt | undefined,
  codes: readonly string[],
): UpdateAttempt | undefined {
  return attempt === undefined
    ? undefined
    : {
        ...attempt,
        failedCodes: attempt.failedCodes.filter((code) => codes.includes(code)),
      };
}

/** The sentences that name the prices that the latest attempt of the quote job could not update, and when the job tries again, or undefined when the attempt updated all of them. A screen that shows only some prices passes an attempt that attemptForCodes narrowed to theirs. */
export function quoteFailureText(
  attempt: UpdateAttempt | undefined,
  quotes: readonly Quote[],
  { now, delayMinutes }: { now: Date; delayMinutes: number },
): string | undefined {
  if (attempt === undefined || attempt.failedCodes.length === 0) {
    return undefined;
  }
  return [
    ...failedPriceSentences(attempt, quotes),
    nextAttemptSentence(attempt, now, delayMinutes),
  ].join(" ");
}

/** The sentences that say why Portolab has no delayed price of a stock and when the quote job tries again, from the latest attempt of the job, which attemptForCodes narrowed to that stock. Before the first attempt, the job is fetching the first prices, because the server starts it at once. */
export function missingQuoteText(
  code: string,
  attempt: UpdateAttempt | undefined,
  { now, delayMinutes }: { now: Date; delayMinutes: number },
): string {
  if (attempt === undefined) {
    return m.market_data_empty_body();
  }
  // An attempt that did not ask for the stock, such as one before the stock joined the stocks that Portolab tracks, left no failure to name.
  return (
    quoteFailureText(attempt, [], { now, delayMinutes }) ??
    [
      m.market_data_no_price_notice({ code }),
      nextAttemptSentence(attempt, now, delayMinutes),
    ].join(" ")
  );
}

/** The sentences that say why Portolab has no delayed price at all: it is fetching its first prices, or its latest attempt failed, in which case they say when the quote job tries again. */
export function noPricesText(
  attempt: UpdateAttempt | undefined,
  { now, delayMinutes }: { now: Date; delayMinutes: number },
): string {
  return attempt?.succeeded === false
    ? [
        m.market_data_empty_failed_body({
          time: formatMarketTime(attempt.attemptedAt),
        }),
        nextAttemptSentence(attempt, now, delayMinutes),
      ].join(" ")
    : m.market_data_empty_body();
}

// A sentence that says that Portolab uses the last price that it stored would be false for a price that Portolab never stored, because that price has no row.
function failedPriceSentences(
  attempt: UpdateAttempt,
  quotes: readonly Quote[],
): string[] {
  const time = formatMarketTime(attempt.attemptedAt);
  const staleCodes: string[] = [];
  const missingCodes: string[] = [];
  for (const code of attempt.failedCodes) {
    if (quotes.some((quote) => quote.code === code)) {
      staleCodes.push(code);
    } else {
      missingCodes.push(code);
    }
  }
  const sentences: string[] = [];
  // The sentence of a failed attempt speaks of the stored prices that the screen shows, so it has nothing to speak of on a screen whose failed prices were never stored.
  if (staleCodes.length > 0) {
    sentences.push(
      attempt.succeeded
        ? sentenceForCodes(staleCodes, time, {
            one: m.market_data_one_stale_price_notice,
            several: m.market_data_several_stale_prices_notice,
          })
        : m.market_data_update_failed_notice({ time }),
    );
  }
  if (missingCodes.length > 0) {
    sentences.push(
      sentenceForCodes(missingCodes, time, {
        one: m.market_data_one_missing_price_notice,
        several: m.market_data_several_missing_prices_notice,
      }),
    );
  }
  return sentences;
}

function sentenceForCodes(
  codes: readonly string[],
  time: string,
  messages: CountedMessages<{ codes: string; time: string }>,
): string {
  return countedText(codes.length, messages, {
    codes: formatList(codes, "conjunction"),
    time,
  });
}

/** When the quote job tries again after its latest attempt. The time comes from the schedule that the job follows, so a page never promises an attempt that the job does not make. Once that time has come, the job is making the attempt, because a page shows the latest attempt that the job finished. */
function nextAttemptSentence(
  attempt: UpdateAttempt,
  now: Date,
  delayMinutes: number,
): string {
  const nextAttempt = nextScheduledAttempt(attempt, delayMinutes);
  return nextAttempt <= now
    ? m.market_data_attempting_now_notice()
    : m.market_data_next_attempt_notice({
        nextTime: formatMarketTime(nextAttempt),
      });
}
