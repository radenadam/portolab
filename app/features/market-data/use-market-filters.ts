import { useEffect, useRef, useState } from "react";
import {
  marketDirectionOptions,
  marketSectorOptions,
  marketSortOptions,
} from "./market-filters";
import type { MarketFilters } from "./market-filters";

/** Hydration must adopt values entered through the native form before scripts arrived. */
export function useMarketFilters(filters: MarketFilters) {
  const [live, setLive] = useState(filters);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = formRef.current;
    if (form === null) return;
    const query = form.querySelector<HTMLInputElement>('input[name="q"]');
    const sector = form.querySelector<HTMLInputElement>(
      'input[name="sector"]:checked',
    );
    const sort = form.querySelector<HTMLSelectElement>('select[name="sort"]');
    const direction = form.querySelector<HTMLSelectElement>(
      'select[name="direction"]',
    );
    setLive({
      ...filters,
      query: query?.value ?? filters.query,
      sector:
        marketSectorOptions().find((option) => option.value === sector?.value)
          ?.value ?? filters.sector,
      sort:
        marketSortOptions().find((option) => option.value === sort?.value)
          ?.value ?? filters.sort,
      direction:
        marketDirectionOptions().find(
          (option) => option.value === direction?.value,
        )?.value ?? filters.direction,
    });
  }, [filters]);
  return { live, setLive, formRef };
}
