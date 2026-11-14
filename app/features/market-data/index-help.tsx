import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import { ChangeText } from "~/change-text";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { measureConcept } from "~/features/measures/measure-concept";
import {
  formatIndexLevel,
  formatNumber,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { IndexQuote } from "./price-source.server";
import { quoteChange } from "./quote-change";
import { QuoteTime } from "./quote-time";
import styles from "./market-view.module.css";

/** The quote supplies the example and change calculation, so the card never invents an index level. */
export function IndexHelp({
  index,
  quote,
  missed,
}: {
  index: string;
  quote: IndexQuote | undefined;
  missed: boolean;
}): ReactNode {
  const concept = measureConcept("market");
  return (
    <ConceptCard
      title={index}
      meaning={concept.meaning}
      lesson={<ConceptLesson termId={concept.termId} />}
      example={
        quote === undefined ? (
          <p>{m.market_data_no_price_notice({ code: index })}</p>
        ) : (
          <>
            <p>
              <strong>{formatIndexLevel(quote.level)}</strong>
            </p>
            <QuoteTime quotedAt={quote.quotedAt} />
            {missed && (
              <p className={styles["missed"]}>{m.market_data_missed_label()}</p>
            )}
          </>
        )
      }
      calculation={
        quote === undefined ? undefined : (
          <>
            <p>{m.market_data_change_label()}</p>
            <p className={styles["equation"]}>
              {formatIndexLevel(quote.level)} ÷{" "}
              {formatIndexLevel(quote.previousLevel)} − {formatNumber(1)} ={" "}
              <ChangeText
                colored
                change={formatSignedPercent(quoteChange(quote))}
              />
            </p>
          </>
        )
      }
    />
  );
}
