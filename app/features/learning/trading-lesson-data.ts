import type { readLearningTrade } from "~/features/trading/read-learning-trade.server";

export type TradingLessonData = ReturnType<typeof readLearningTrade>;
