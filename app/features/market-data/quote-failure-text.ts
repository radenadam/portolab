import { countedText } from "~/counted-text";
import type { CountedMessages } from "~/counted-text";
import { formatList, formatMarketTime } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Quote } from "./price-source.server";
import type { UpdateAttempt } from "./update-attempts.server";
import { nextScheduledAttempt } from "./update-schedule";

/** The sentences that name the prices that the latest attempt of the quote job could not update, and when the job tries again, or undefined when the attempt updated all of them. A screen that shows only some prices passes an attempt whose failed codes it narrowed to theirs. */
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
  if (!attempt.succeeded) {
    sentences.push(m.market_data_update_failed_notice({ time }));
  } else if (staleCodes.length > 0) {
    sentences.push(
      sentenceForCodes(staleCodes, time, {
        one: m.market_data_one_stale_price_notice,
        several: m.market_data_several_stale_prices_notice,
      }),
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
export function nextAttemptSentence(
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
