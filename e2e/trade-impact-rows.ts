import type { Locator, Page } from "@playwright/test";

type ImpactScope = Locator | Page;

export function impactRowGroups(scope: ImpactScope): Locator {
  return scope.locator("[data-impact-rows]");
}

export function impactRows(scope: ImpactScope): Locator {
  return impactRowGroups(scope).locator(":scope > div");
}

export function impactAfterValue(scope: ImpactScope, index: number): Locator {
  return impactRows(scope).nth(index).locator(":scope > strong");
}
