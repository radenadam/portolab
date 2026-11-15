import { test } from "@playwright/test";
import type { Browser, BrowserContextOptions, Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";

/** Opens a page in a context of its own, with the device of the project and a language, as the device of another person or a second device of the same person. The device opens the site at the address of the project, or at another address of the same server, such as the domain of a public server, and it can take other settings, such as a browser without JavaScript with the cookies of another device. The test closes its context. */
export async function newDevice(
  browser: Browser,
  locale: Locale,
  {
    siteUrl = test.info().project.use.baseURL,
    ...settings
  }: { siteUrl?: string | undefined } & Pick<
    BrowserContextOptions,
    "javaScriptEnabled" | "storageState" | "locale"
  > = {},
): Promise<Page> {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } =
    test.info().project.use;
  const context = await browser.newContext({
    ...(siteUrl === undefined ? {} : { baseURL: siteUrl }),
    ...(viewport === undefined ? {} : { viewport }),
    ...(userAgent === undefined ? {} : { userAgent }),
    ...(deviceScaleFactor === undefined ? {} : { deviceScaleFactor }),
    ...(isMobile === undefined ? {} : { isMobile }),
    ...(hasTouch === undefined ? {} : { hasTouch }),
    ...settings,
  });
  const page = await context.newPage();
  await chooseLanguage(page, locale);
  return page;
}
