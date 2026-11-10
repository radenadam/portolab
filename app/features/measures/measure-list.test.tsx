import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { monthlyReturn } from "~/units/monthly-return";
import { MarketLinePosition } from "./measure-list";

const positions: Record<
  Locale,
  { above: string; below: string; onLine: string }
> = {
  id: {
    above:
      "Imbal hasil yang diharapkan berada di atas garis pasar sekuritas, sehingga lebih tinggi daripada imbal hasil yang disyaratkan CAPM untuk betanya.",
    below:
      "Imbal hasil yang diharapkan berada di bawah garis pasar sekuritas, sehingga lebih rendah daripada imbal hasil yang disyaratkan CAPM untuk betanya.",
    onLine:
      "Imbal hasil yang diharapkan berada pada garis pasar sekuritas dalam batas pembulatan jaraknya, sehingga sesuai dengan imbal hasil yang disyaratkan CAPM untuk betanya.",
  },
  en: {
    above:
      "The expected return lies above the security market line, so it is higher than the return that CAPM requires for its beta.",
    below:
      "The expected return lies below the security market line, so it is lower than the return that CAPM requires for its beta.",
    onLine:
      "The expected return lies on the security market line within the rounding of its distance, so it matches the return that CAPM requires for its beta.",
  },
};

function render(distance: number): string {
  return renderToStaticMarkup(
    <MarketLinePosition distance={monthlyReturn(distance)} />,
  );
}

for (const locale of locales) {
  test(`places an expected return above, below, or on the security market line by the sign that its rounded distance shows, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = positions[locale];
    expect(render(0.0001)).toBe(`<p>${text.above}</p>`);
    expect(render(-0.0001)).toBe(`<p>${text.below}</p>`);
    // A distance of less than half a hundredth of a percent shows as 0.00% without a sign, in either direction.
    expect(render(0.00004)).toBe(`<p>${text.onLine}</p>`);
    expect(render(-0.00004)).toBe(`<p>${text.onLine}</p>`);
  });
}
