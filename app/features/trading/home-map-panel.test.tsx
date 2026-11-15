import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { courseSessions } from "~/features/classes/course-calendar";
import { valuationForTest } from "~/features/measures/measures-for-test.server";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { beta } from "~/units/beta";
import { cumulativeReturn } from "~/units/cumulative-return";
import { indexPoints } from "~/units/index-points";
import { HomeMapPanel } from "./home-map-panel";
import { homeMapPoints } from "./home-map-points";
import { homePortfolioForTest } from "./home-portfolio-for-test";

const texts: Record<
  Locale,
  {
    common: readonly string[];
    time: readonly string[];
    unknownWeight: string;
    weight: string;
  }
> = {
  id: {
    common: [
      "Posisi Anda di peta",
      "Tampilan posisi portofolio",
      "Peta",
      "Grafik waktu",
      "Portofolio Anda",
      "Saham Anda, ukuran = bobot",
      "Teman sekelas",
      "Teman sekelas tanpa nama",
      "Tegak: imbal hasil. Saham dihitung sejak dibeli, portofolio sejak 30 Okt.",
      "Beta (1 = pasar)",
      "Tabel titik pada peta",
      "Imbal hasil",
      "Waktu harga saham di tabel kepemilikan. IHSG 30 Okt 2026, 16.00 WIB.",
      "Sesi 2 · Diversifikasi",
      "Pelajari",
      "Peta tampil setelah pembaruan harga membawa IHSG dan riwayat harga menyimpan penutupan awal periode Anda.",
    ],
    time: [
      "S1",
      "Portolab belum menyimpan harga penutupan IHSG pada 30 Oktober 2026. Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan IHSG pada hari itu atau hari sesudahnya.",
    ],
    unknownWeight: "Bobot belum tersedia",
    weight: "Bobot",
  },
  en: {
    common: [
      "Your position on the map",
      "Portfolio position view",
      "Map",
      "Time chart",
      "Your portfolio",
      "Your holdings, size = weight",
      "Classmates",
      "Unnamed classmate",
      "Vertical: return. Holdings count since purchase, the portfolio since Oct 30.",
      "Beta (1 = market)",
      "Table of map points",
      "Return",
      "Holding quote times are in the holdings table. IHSG Oct 30, 2026, 4:00 PM WIB.",
      "Session 2 · Diversification",
      "Learn",
      "The map appears once a price update brings the IHSG and the price history stores the close at the start of your period.",
    ],
    time: [
      "S1",
      "Portolab has not stored the close of IHSG on October 30, 2026 yet. It shows the returns from that day on once an update of the price history stores a close of IHSG on that day or on a later day.",
    ],
    unknownWeight: "Weight unavailable",
    weight: "Weight",
  },
};

for (const locale of locales) {
  test(`draws current returns, anonymous classmates, holding weights, and the calendar in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const home = homePortfolioForTest();
    home.classmates = [{ beta: beta(1.2), return: cumulativeReturn(0.03) }];
    // The IHSG quote is recorded in fixture-price-source.server.ts. Its return is supplied separately because the map does not recompute the portfolio report.
    home.report.market = {
      quote: {
        kind: "index",
        code: "IHSG",
        level: indexPoints(5057.05),
        previousLevel: indexPoints(5098.06),
        quotedAt: new Date("2026-10-30T09:00:05Z"),
      },
      return: cumulativeReturn(-0.01),
    };
    home.sessions = courseSessions("2026-10-30");
    const render = () =>
      renderMarkupForTest(
        <HomeMapPanel
          home={home}
          classId={7 as ClassId}
          reader={{ kind: "owner", classId: 7 as ClassId }}
        />,
      );
    const html = render();
    for (const sentence of texts[locale].common.slice(0, -1))
      expect(html).toContain(markupTextForTest(sentence));
    expect(html).not.toContain("stroke-dasharray");
    expect(html).not.toContain(">SML<");
    expect(html).toContain('href="/classes/7?view=time"');
    const map = homeMapPoints(home);
    expect(map?.points.map(({ mark }) => mark.kind)).toEqual([
      "classmate",
      "held",
      "held",
      "own",
    ]);
    expect(map?.points.find(({ key }) => key === "BBCA")).toMatchObject({
      up:
        home.report.valuation.holdings[0]?.kind === "priced"
          ? home.report.valuation.holdings[0].gainReturn
          : undefined,
      mark: { weight: 0.5 },
    });
    const knownMarket = home.report.market;
    home.report.market = undefined;
    expect(render()).toContain(texts[locale].common.at(-1));
    home.report.market = knownMarket;
    home.view = "time";
    expect(render()).toContain(texts[locale].time[0]);
    home.report.history = {
      ok: true,
      value: {
        points: [],
        end: { kind: "missingCloses", codes: ["IHSG"], date: "2026-10-30" },
      },
    };
    expect(render()).toContain(texts[locale].time[1]);
    home.view = "map";
    home.report.valuation = valuationForTest(["BBCA"]);
    home.measures = { kind: "unpriced", codes: ["TLKM"] };
    home.stockBetas = [{ code: "BBCA", beta: beta(0.69) }];
    expect(
      homeMapPoints(home)?.points.find(({ key }) => key === "BBCA")?.values,
    ).toContainEqual({
      name: texts[locale].weight,
      value: texts[locale].unknownWeight,
    });
    expect(
      homeMapPoints(home)?.points.some(({ mark }) => mark.kind === "own"),
    ).toBe(false);
  });
}
