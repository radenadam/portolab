import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "./language-names";
import { Message } from "./message";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";

const examples: Record<
  Locale,
  {
    text: (values: Record<"name" | "amount", string>) => string;
    expected: string;
  }
> = {
  id: {
    text: ({ name, amount }) => `${name} memegang ${amount}. ${name}.`,
    expected:
      "<b>&lt;BBCA&gt;</b> memegang <span>5</span>. <b>&lt;BBCA&gt;</b>.",
  },
  en: {
    text: ({ name, amount }) => `${amount} held by ${name}. ${name}.`,
    expected:
      "<span>5</span> held by <b>&lt;BBCA&gt;</b>. <b>&lt;BBCA&gt;</b>.",
  },
};

for (const locale of locales) {
  test(`keeps values as escaped markup in the translation's order and at each occurrence in ${languageNames[locale]}`, () => {
    expect(
      renderToStaticMarkup(
        <Message
          text={examples[locale].text}
          values={{ name: <b>{"<BBCA>"}</b>, amount: <span>{5}</span> }}
        />,
      ),
    ).toBe(examples[locale].expected);
  });
}
