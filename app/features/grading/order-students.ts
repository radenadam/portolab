import type { ClassPortfolios } from "./read-class-portfolios.server";
import { rankingValue } from "./ranking-measure";
import type { RankingMeasure } from "./ranking-measure";
import type { ComparedStudent } from "./student-filters";

export function orderStudents(
  portfolios: ClassPortfolios,
  measure: RankingMeasure,
): ComparedStudent[] {
  return [...portfolios.ranked, ...portfolios.unmeasured].sort(
    (first, second) => {
      const firstValue = rankingValue(first, measure);
      const secondValue = rankingValue(second, measure);
      if (firstValue.ok && secondValue.ok)
        return (
          secondValue.value - firstValue.value ||
          first.joinOrder - second.joinOrder
        );
      if (firstValue.ok) return -1;
      if (secondValue.ok) return 1;
      return first.joinOrder - second.joinOrder;
    },
  );
}
