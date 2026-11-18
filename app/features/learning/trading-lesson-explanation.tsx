import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import { formatPercent } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { basisPointsPerWhole } from "~/units/basis-points";
import type { ContentBlock, SessionContent } from "./content";
import { ContentParagraphs } from "./content-paragraphs";
import { learningPriceSourceText } from "./learning-price-source-text";
import type { TradingLessonData } from "./trading-lesson-data";
import { TickTable, BandTable } from "./trading-rule-tables";

export function TradingLessonExplanation({
  lesson,
  trading,
}: {
  lesson: SessionContent;
  trading: TradingLessonData;
}): ReactNode {
  return (
    <ConceptHelp title={lesson.title}>
      <ContentParagraphs
        blocks={lesson.sections.flatMap((section) =>
          section.id === "body" ? section.blocks : [],
        )}
        reference={(block) =>
          block.kind === "table" ? tradingTable(block.id, trading) : null
        }
      />
    </ConceptHelp>
  );
}

function tradingTable(
  id: Extract<ContentBlock, { kind: "table" }>["id"],
  trading: TradingLessonData,
): ReactNode {
  const day = trading.day;
  switch (id) {
    case "trading-rules":
      return day?.ok === true ? (
        <>
          <TickTable rules={day.value.rules} />
          <BandTable rules={day.value.rules} />
        </>
      ) : null;
    case "trading-sessions":
    case "estimation-settings":
      return null;
    case "price-source":
      return (
        <p>
          <NumberText>{learningPriceSourceText(trading.source)}</NumberText>
        </p>
      );
    case "transaction-costs": {
      if (day?.ok !== true) return null;
      const { rates } = day.value;
      return (
        <p>
          <NumberText>
            {m.learning_trading_costs_notice({
              buy: formatPercent(rates.buyFee / basisPointsPerWhole, "two"),
              sell: formatPercent(rates.sellFee / basisPointsPerWhole, "two"),
              tax: formatPercent(rates.salesTax / basisPointsPerWhole, "two"),
            })}
          </NumberText>
        </p>
      );
    }
  }
}
