import type { ReactNode } from "react";
import type { LessonTask } from "~/features/learning/lesson-task";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { m } from "~/paraglide/messages.js";
import { NumberText } from "~/number-text";
import type { MarketFilters } from "./market-filters";
import { marketPath } from "./market-path";
import { marketSearch } from "./market-search";
import styles from "./market-view.module.css";

export function MarketEmpty({
  classId,
  filters,
  task,
}: {
  classId: ClassId;
  filters: MarketFilters;
  task?: LessonTask | undefined;
}): ReactNode {
  const query = filters.query.trim();
  return (
    <div className={styles["empty"]}>
      <p>
        <NumberText>
          {(textValue) =>
            query === ""
              ? m.market_data_empty_sector_notice()
              : m.market_data_no_results_notice({ query: textValue(query) })
          }
        </NumberText>
      </p>
      <Link
        to={`${marketPath(classId)}${marketSearch({ ...filters, query: "", sector: "all" }, task)}`}
      >
        {m.market_data_clear_link()}
      </Link>
    </div>
  );
}
