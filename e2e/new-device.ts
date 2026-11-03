import { test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";

/** Opens a page in a context of its own, with the device of the project and a language, as the device of another person or a second device of the same person. The test closes its context. */
export async function newDevice(
  browser: Browser,
  locale: Locale,
): Promise<Page> {
  const {
    baseURL,
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
  } = test.info().project.use;
  const context = await browser.newContext({
    ...(baseURL === undefined ? {} : { baseURL }),
    ...(viewport === undefined ? {} : { viewport }),
    ...(userAgent === undefined ? {} : { userAgent }),
    ...(deviceScaleFactor === undefined ? {} : { deviceScaleFactor }),
    ...(isMobile === undefined ? {} : { isMobile }),
    ...(hasTouch === undefined ? {} : { hasTouch }),
  });
  const page = await context.newPage();
  await chooseLanguage(page, locale);
  return page;
}
