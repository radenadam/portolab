import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { classOfStudentsForTest } from "./class-of-students-for-test.server";
import { ClassPortfoliosView } from "./class-portfolios-view";
import type { ClassPortfolios } from "./read-class-portfolios.server";
import { readClassPortfolios } from "./read-class-portfolios.server";

// class-of-students-for-test.server.ts describes the students, and read-class-portfolios.server.test.ts gives the sentence about the price of AMMN, which the latest update of the class could not fetch. student-standings.test.tsx checks each student of the lists.
const yahooFinance: PriceSourceDescription = {
  name: "Yahoo Finance",
  delayMinutes: 10,
};

const texts: Record<
  Locale,
  {
    valuation: string;
    method: string;
    exportLink: string;
    exportNotice: string;
    rankedTitle: string;
    rankedNotice: string;
    noRanked: string;
    unmeasuredTitle: string;
    noStudents: string;
  }
> = {
  id: {
    valuation:
      "Setiap portofolio adalah simulasi dengan uang virtual. Portolab menilai setiap saham yang dipegang pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI. Halaman portofolio setiap mahasiswa menunjukkan setiap harga tertunda, waktu pencatatannya, dan harga yang tidak dapat diambil oleh pembaruan terakhir.",
    method:
      "Ukuran ini adalah simulasi dari harga penutupan masa lalu. Setiap imbal hasil bulanan adalah perubahan harga penutupan final dari hari bursa terakhir suatu bulan ke hari bursa terakhir bulan berikutnya, tanpa dividen. Ukuran suatu saham atau portofolio memakai bulan-bulan di antara 60 bulan lengkap terakhir yang di dalamnya IHSG dan setiap sahamnya memiliki imbal hasil, dan memerlukan paling sedikit 24 imbal hasil bulanan. Setiap nilai berlaku per bulan.",
    exportLink: "Unduh portofolio ini sebagai spreadsheet",
    exportNotice:
      "Spreadsheet ini adalah workbook Excel yang memuat nilai dan ukuran di halaman ini, dengan urutan yang sama. Excel, Google Sheets, dan LibreOffice dapat membukanya, dan masing-masing menulis angkanya dalam format bahasanya sendiri.",
    rankedTitle: "Portofolio yang memiliki ukuran",
    rankedNotice:
      "Portolab mengurutkan portofolio ini menurut jarak imbal hasil yang diharapkannya dari garis pasar sekuritas, dari yang tertinggi sampai yang terendah. Jarak itu membandingkan imbal hasil yang diharapkan dengan imbal hasil yang disyaratkan CAPM untuk beta portofolio, sehingga urutannya menghargai imbal hasil sesuai risiko yang diambil portofolio, bukan imbal hasil saja.",
    noRanked:
      "Belum ada portofolio di kelas ini yang memiliki ukuran, sehingga Portolab belum mengurutkan satu pun. Setiap portofolio di bawah menjelaskan alasannya.",
    unmeasuredTitle: "Portofolio yang belum memiliki ukuran",
    noStudents:
      "Belum ada mahasiswa yang bergabung di kelas ini, sehingga belum ada portofolio untuk ditampilkan.",
  },
  en: {
    valuation:
      "Each portfolio is a simulation with virtual cash. Portolab values each holding at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX. The page of the portfolio of each student shows each delayed price, when it was quoted, and the prices that the latest update could not fetch.",
    method:
      "These measures are a simulation from past closes. Each monthly return is the change of the final close from the last trading day of one month to the last trading day of the next, without dividends. The measures of a stock or of a portfolio use the months, among the latest 60 complete months, in which the IHSG and each of its stocks have a return, and they need at least 24 monthly returns. Every value is per month.",
    exportLink: "Download the portfolios as a spreadsheet",
    exportNotice:
      "The spreadsheet is an Excel workbook with the values and the measures of this page, in the same order. Excel, Google Sheets, and LibreOffice open it, and each writes its numbers in the format of its own language.",
    rankedTitle: "Portfolios with measures",
    rankedNotice:
      "Portolab ranks these portfolios by the distance of their expected return from the security market line, from the highest to the lowest. The distance compares the expected return with the return that CAPM requires for the beta of the portfolio, so the rank rewards the return for the risk that a portfolio takes, not the return alone.",
    noRanked:
      "No portfolio of this class has measures yet, so Portolab ranks none. Each portfolio below says why it has none.",
    unmeasuredTitle: "Portfolios without measures yet",
    noStudents:
      "No student has joined this class yet, so there is no portfolio to show.",
  },
};

// The class of the test is the first class of a new database.
const classId = 1 as ClassId;

function render(portfolios: ClassPortfolios): string {
  return renderInRouterForTest(
    <ClassPortfoliosView
      classId={classId}
      portfolios={portfolios}
      source={yahooFinance}
    />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

for (const locale of locales) {
  const text = texts[locale];

  test(`names the prices that the latest update could not fetch after the notice of delayed prices, and shows the students with measures and without, or only without, or that no student joined, in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { database, taughtClass } = await classOfStudentsForTest();
    expect(taughtClass.id).toBe(classId);
    const portfolios = readClassPortfolios(database, taughtClass, {
      request: new Request("http://localhost/classes/1/portfolios"),
      now: new Date("2026-10-30T09:20:00Z"),
      delayMinutes: 10,
    });
    expect(portfolios.quoteFailure).toBeDefined();
    const html = render(portfolios);
    expect(html).toContain(
      [
        `<p>${text.valuation}</p>`,
        `<p>${portfolios.quoteFailure ?? ""}</p>`,
        `<p>${text.method}</p>`,
        `<a href="/classes/1/portfolios/export">${text.exportLink}</a>`,
        `<p>${text.exportNotice}</p>`,
        `<h2>${text.rankedTitle}</h2>`,
        `<p>${text.rankedNotice}</p>`,
        "<ol>",
      ].join(""),
    );
    expect(html).toContain(`</ol><h2>${text.unmeasuredTitle}</h2><ul>`);
    expect(
      render({ ...portfolios, ranked: [], quoteFailure: undefined }),
    ).toContain(
      `<p>${text.valuation}</p><p>${text.method}</p><a href="/classes/1/portfolios/export">${text.exportLink}</a><p>${text.exportNotice}</p><h2>${text.rankedTitle}</h2><p>${text.noRanked}</p><h2>${text.unmeasuredTitle}</h2><ul>`,
    );
    expect(
      render({ ranked: [], unmeasured: [], quoteFailure: undefined }),
    ).toBe(`<p>${text.noStudents}</p>`);
  });
}
