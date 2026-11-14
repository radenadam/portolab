import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Holding } from "./holding-after-fill";
import {
  acceptedForTest,
  accountForTest,
  bbcaForTest,
  duringSessionForTest,
  limitForTest,
  orderLotsForTest,
  purchaseForTest,
  saleForTest,
} from "./orders-for-test";
import { CashSummary, HoldingList } from "./portfolio-summary";

// The orders of 10:00 WIB on Monday 2 November 2026, while the latest quote of BBCA was Rp4,980. A market purchase of 5 lots sets aside Rp2,493,735 and a limit purchase of 1 lot at Rp4,950 sets aside Rp495,743, which the decimal module of Python computed with a broker fee of 0.15% rounded to a whole rupiah with ROUND_HALF_UP. Together they set aside Rp2,989,478 of Rp100 million. Intl puts a no-break space after the currency, which the texts write as \u00a0.
const bbcaHolding: Holding = {
  code: "BBCA",
  shares: shares(500),
  cost: rupiah(2_493_735),
};
const account = accountForTest({ holdings: [bbcaHolding] });
const purchases = [
  acceptedForTest(purchaseForTest(), account, bbcaForTest),
  acceptedForTest(
    purchaseForTest({ lots: orderLotsForTest(1), price: limitForTest(4_950) }),
    account,
    bbcaForTest,
  ),
];
const oneLotSale = acceptedForTest(
  saleForTest({ lots: orderLotsForTest(1), price: limitForTest(5_050) }),
  account,
  bbcaForTest,
);
// A lot of IDX holds 100 shares, so a holding of 1 share comes only once a later record of the rules of IDX sets a lot of 1 share, at the cost of 1 share at Rp4,980 with a fee of Rp7.
const oneShare: Holding = {
  code: "TLKM",
  shares: shares(1),
  cost: rupiah(4_987),
};

const texts: Record<
  Locale,
  {
    cash: string;
    noHoldings: string;
    oneSale: readonly string[];
    severalSales: string;
    oneShare: string;
  }
> = {
  id: {
    cash: "<dt>Kas</dt><dd>Rp\u00a0100.000.000</dd><dt>Kas yang disisihkan</dt><dd>Rp\u00a02.989.478</dd><dt>Kas yang tersedia</dt><dd>Rp\u00a097.010.522</dd>",
    noHoldings: "<p>Anda tidak memegang saham.</p>",
    oneSale: [
      "BBCA",
      "500 saham dengan biaya Rp\u00a02.493.735, termasuk biaya broker.",
      "Order jual Anda yang masih terbuka menyisihkan 100 saham dari saham ini.",
    ],
    severalSales:
      "Sebanyak 2 order jual Anda yang masih terbuka menyisihkan 200 saham dari saham ini.",
    oneShare: "1 saham dengan biaya Rp\u00a04.987, termasuk biaya broker.",
  },
  en: {
    cash: "<dt>Cash</dt><dd>IDR\u00a0100,000,000</dd><dt>Cash set aside</dt><dd>IDR\u00a02,989,478</dd><dt>Available cash</dt><dd>IDR\u00a097,010,522</dd>",
    noHoldings: "<p>You hold no shares.</p>",
    oneSale: [
      "BBCA",
      "500 shares that cost IDR\u00a02,493,735, broker fees included.",
      "Your open sell order sets aside 100 shares of this holding.",
    ],
    severalSales:
      "Your 2 open sell orders set aside 200 shares of this holding.",
    oneShare: "1 share that cost IDR\u00a04,987, broker fees included.",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`shows the cash, what the open buy orders set aside, and the cash that is left, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      renderToStaticMarkup(
        <CashSummary
          cash={account.cash}
          orders={[...purchases, oneLotSale]}
          now={duringSessionForTest}
        />,
      ),
    ).toContain(text.cash);
  });

  test(`shows each holding with its shares, its cost, and what one open sale or several set aside of it, in ${language}`, () => {
    switchLocaleForTest(locale);
    const withOneSale = renderToStaticMarkup(
      <HoldingList
        holdings={[bbcaHolding]}
        orders={[oneLotSale]}
        now={duringSessionForTest}
      />,
    );
    for (const sentence of text.oneSale) {
      expect(withOneSale).toContain(sentence);
    }
    expect(
      renderToStaticMarkup(
        <HoldingList
          holdings={[bbcaHolding]}
          orders={[oneLotSale, oneLotSale]}
          now={duringSessionForTest}
        />,
      ),
    ).toContain(text.severalSales);
  });

  test(`shows a holding of 1 share in the singular, and no sale for a holding that no order sells, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = renderToStaticMarkup(
      <HoldingList
        holdings={[oneShare]}
        orders={[oneLotSale]}
        now={duringSessionForTest}
      />,
    );
    expect(html).toContain(text.oneShare);
    expect(html).not.toContain(text.oneSale[2]);
  });

  test(`says that the portfolio holds no shares, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      renderToStaticMarkup(
        <HoldingList holdings={[]} orders={[]} now={duringSessionForTest} />,
      ),
    ).toBe(text.noHoldings);
  });
}
