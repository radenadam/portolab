import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Opens an address and checks that it answers as an address that does not exist, with the status 404 and the title of the page that says so in the language of the reader. */
export async function expectMissingPage(
  reader: Page,
  path: string,
  notFoundTitle: string,
): Promise<void> {
  const answer = await reader.goto(path);
  expect(answer?.status(), path).toBe(404);
  await expect(reader).toHaveTitle(`${notFoundTitle} | Portolab`);
}
