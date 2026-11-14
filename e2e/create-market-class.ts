import type { Page } from "@playwright/test";
import { signInAsNewLecturer } from "./accounts.ts";
import { createTestClass } from "./create-test-class.ts";
import type { TestClass } from "./create-test-class.ts";

/** A shared class fixture keeps the market flows on the same setup. */
export async function createMarketClass(page: Page): Promise<TestClass> {
  await signInAsNewLecturer(page, "Dosen Pasar");
  return createTestClass(page, "Manajemen Portofolio");
}
