import { expect, test } from "@playwright/test";
import { expectDefinitionTerms } from "./expect-definition-terms.ts";

test("accepts flow content inside a definition term and sectioning content in its description", async ({
  page,
}) => {
  await page.setContent(
    "<dl><dt>Name<div popover><div><p>Meaning</p><details><summary>Calculation</summary><p>Value</p></details></div></div></dt><dd><article><h1>Details</h1></article></dd></dl>",
  );
  await expectDefinitionTerms(page);
});

test("rejects every heading, section, header, and footer inside a definition term, including a closed popover", async ({
  page,
}) => {
  const tags = [
    "header",
    "footer",
    "article",
    "aside",
    "nav",
    "section",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hgroup",
  ];
  for (const tag of tags) {
    for (const parent of ["div", "div popover"]) {
      await page.setContent(
        `<dl><dt>Name<${parent}><${tag}>${tag === "hgroup" ? "<h2>Invalid</h2>" : "Invalid"}</${tag}></div></dt><dd>Value</dd></dl>`,
      );
      await expect(page.locator(`dt ${tag}`)).toHaveCount(1);
      await expect(expectDefinitionTerms(page)).rejects.toThrow();
    }
  }
});
