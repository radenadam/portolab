import { LessonTaskBanner } from "./lesson-task-banner";
import {
  TradingLessonPractice,
  TradingOwnNumbers,
} from "./trading-lesson-practice";
import { expect, test, vi } from "vitest";
import type { Locale } from "~/paraglide/runtime.js";
import { locales } from "~/paraglide/runtime.js";
import { languageNames } from "~/language-names";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { textOfMarkupForTest } from "~/text-of-markup-for-test";
import { elementTextsForTest } from "~/element-texts-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { successValueForTest } from "~/success-value-for-test";
import type { ClassId } from "~/features/classes/classes.schema";
import { localizedLearningContent } from "./localized-learning-content.server";
import { lessonPracticeForTest } from "./lesson-practice-for-test";
import { tradingLessonForTest } from "./trading-lesson-for-test";
import { LessonTrading } from "./lesson-trading";
import { LessonPractice } from "./lesson-practice";
import { PriceGuideView } from "./price-guide-view";
import { readPriceGuide } from "./read-price-guide.server";
import { useIsInBrowser } from "~/use-is-in-browser";
import {
  databaseWithClosesForTest,
  cashValuationForTest,
} from "~/features/measures/measures-for-test.server";
import { readLessonExample } from "./read-lesson-example.server";

import {
  tradeWithCosts,
  cashChange,
  costRatesOn,
} from "~/features/trading/trading-costs";
import { orderLotsForTest } from "~/features/trading/orders-for-test";
import { rupiah } from "~/units/rupiah";
import { fail } from "~/result";
import { learningPriceSourceText } from "./learning-price-source-text";

const tradingDataTexts: Record<Locale, string> = {
  id: "Data perdagangan belum tersedia. Buka Pasar untuk memeriksa harga dan status pembaruannya.",
  en: "Trading data is unavailable. Open Market to check prices and their update status.",
};

vi.mock("~/use-is-in-browser", () => ({ useIsInBrowser: vi.fn(() => false) }));

const delayTexts: Record<Locale, string> = {
  id: "Sumber harga adalah Recorded source, dengan keterlambatan 1 menit.",
  en: "Prices come from Recorded source, with a delay of 1 minute.",
};

const texts: Record<Locale, readonly string[]> = {
  id: [
    "Imbal hasil harapan -0,10%, risiko 5,23% per bulan.",
    [
      "Tugas.",
      "Buka tiket Limit, baca data yang masih diperlukan, lalu kembali ke pelajaran tanpa mengirim order.",
    ].join(" "),
    "Tinjau harga pada tiket Limit, lalu kembali ke pelajaran tanpa mengirim order.",
    "Tambahkan saham agar Anda dapat membandingkan pasangan di pelajaran ini.",
    "BBCA: 5,23% · -0,10%",
    "Imbal hasil/bln",
    "Portofolio",
    "ARA +25%",
    "ARB -7%",
    "Dua saham, satu portofolio",
    "Simpangan baku portofolio dua saham dari bobot, simpangan baku, dan korelasi keduanya. Korelasi yang lebih rendah memberi risiko yang lebih kecil.",
    "Saham A",
    "Saham B",
    "Korelasi ρ",
    "Risiko portofolio",
    "Rata-rata risiko",
    "Pakai di grafik",
    "Praktik ini membandingkan pasangan saham Anda. Setelah portofolio Anda memiliki dua saham dengan data bulanan yang cukup, kembali ke sini untuk membandingkannya.",
    "Cari saham untuk dibandingkan",
    "Risiko/bln",
    "Jika ρ = 1",
    "Harga saham",
    "Fraksi",
    "Harga acuan",
    "ARA",
    "ARB",
    "Senin sampai Kamis",
    "Jumat",
    "Coba satu harga",
    tradingDataTexts.id,
    "Jam perdagangan",
    "Batas atas harga order",
    "Batas bawah harga order",
    "Belum ada order Anda yang terisi. Setelah sebuah order terisi, rincian biayanya tampil di sini.",
    [
      "Tugas.",
      "Tiket ini memakai order Limit. Naikkan harganya dengan tombol + sampai melewati ARA, baca batas harganya, lalu tutup tiket tanpa mengirim order.",
    ].join(" "),
    "Buka tiket BBCA dengan Limit",
    "Panduan harga",
    "Contoh baris harga",
    "Kode saham",
    "Harga terakhir",
    "Perubahan",
    "Waktu kutipan",
    "Berapa uang untuk satu lot?",
    "Temukan saham dengan perubahan harian terbesar, lalu baca kode, harga, perubahan, dan waktu harganya.",
    "Buka Pasar untuk tugas ini",
    "Cara membaca harga saham",
    "Bobot BBCA",
    "50% BBCA · 50% TLKM",
    "Korelasi asli dari 60 imbal hasil bulanan. Geser untuk membandingkan gerak yang lebih searah atau berlawanan.",
    "Rata-rata tertimbang risiko aset Anda 4,68% per bulan, sedangkan risiko portofolionya 4,07%. Selisihnya 0,61 poin persentase.",
    "Korelasi setiap pasangan saham Anda dari 60 imbal hasil bulanan, dari yang terendah.",
    [
      "Tugas.",
      "Pakai pasangan dengan korelasi terendah di grafik, lalu catat berapa poin risiko portofolio lebih kecil daripada rata-rata risikonya pada bobot 50%.",
    ].join(" "),
    "Kurva BBCA dan TLKM dengan korelasi 0,50. Risiko portofolio 5,27%, imbal hasil -0,33% per bulan.",
    "Semua bobot dengan ρ 0,50",
    String.raw`σ_p^2 = w_i^2σ_i^2 + w_j^2σ_j^2 + 2w_iw_jρ_{ij}σ_iσ_j \\ = 0,50^2 × 5,23%^2 \\ + 0,50^2 × 6,88%^2 \\ + 2 × 0,50 × 0,50 × 0,50 × 5,23% × 6,88%`,
    String.raw`σ_p = \sqrt{σ_p^2}`,
    "= 5,266% per bulan",
    "Praktik",
    "Tugas. Temukan saham dengan perubahan harian terbesar, lalu baca kode, harga, perubahan, dan waktu harganya.",
    "Rp 1 sampai di bawah Rp 200",
    "Rp 5.000 ke atas",
    "Rp 15 sampai Rp 200",
    "Sesi 1",
    "Sesi 1: 09.00 sampai 12.00",
    "Sesi 1: 09.00 sampai 11.30",
    "Sesi 2: 13.30 sampai 15.50",
    "Sesi 2: 14.00 sampai 15.50",
    "Warna muda adalah pra-pembukaan mulai 08.45, pra-penutupan sampai 16.00, dan pascapenutupan sampai 16.15. Jam dalam WIB.",
    "Biaya beli 0,15%, biaya jual 0,15%, dan pajak penjualan 0,10% dari nilai transaksi. Setiap biaya dibulatkan ke rupiah terdekat.",
    "Harga berikutnya Rp 600",
    "1 lot",
    "Beli 1 lot",
    "Jual 1 lot",
    "Biaya Rp 89",
    "Biaya Rp 89 + PPh Rp 60",
    "Order terakhir Anda: beli 35 lot BMRI pada Rp 3.700. Nilainya Rp 12.950.000, biaya broker Rp 19.425, jadi total dibayar Rp 12.969.425.",
    "Order terakhir Anda: jual 35 lot BMRI pada Rp 3.700. Nilainya Rp 12.950.000, biaya broker Rp 19.425, PPh Rp 12.950, jadi total diterima Rp 12.917.625.",
    "Harga BBCA Rp 4.980, dikutip pada 30 Okt 2026, 16.14.",
    "Untuk hari bursa 2 November 2026, harga acuan Rp 4.980 memberi batas harga order dari ARB Rp 4.640 sampai ARA Rp 6.225.",
    "1 lot = 100 lembar. Pada harga Rp 4.980, 1 lot BBCA bernilai Rp 498.000, ditambah biaya broker 0,15%, yaitu Rp 747, sehingga totalnya Rp 498.747.",
    "Harga BBCA bergerak per Rp 10. Langkah ini disebut fraksi harga.",
    "Sumber harga adalah Recorded source, dengan keterlambatan 10 menit.",
  ],
  en: [
    "Expected return -0.10%, risk 5.23% per month.",
    [
      "Task.",
      "Open the Limit ticket, read which data is still needed, then return to the lesson without placing an order.",
    ].join(" "),
    "Review the price in the Limit ticket, then return to the lesson without placing an order.",
    "Add holdings so you can compare stock pairs in this lesson.",
    "BBCA: 5.23% · -0.10%",
    "Return/month",
    "Portfolio",
    "ARA +25%",
    "ARB -7%",
    "Two stocks, one portfolio",
    "The standard deviation of a portfolio of two stocks from their weights, their standard deviations, and their correlation. A lower correlation gives a smaller risk.",
    "Stock A",
    "Stock B",
    "Correlation ρ",
    "Portfolio risk",
    "Average risk",
    "Use in chart",
    "This practice compares pairs of your stocks. Once your portfolio holds two stocks with enough monthly data, return here to compare them.",
    "Find stocks to compare",
    "Risk/month",
    "If ρ = 1",
    "Stock price",
    "Tick size",
    "Reference price",
    "ARA",
    "ARB",
    "Monday to Thursday",
    "Friday",
    "Try a price",
    tradingDataTexts.en,
    "Trading hours",
    "Upper order price limit",
    "Lower order price limit",
    "None of your orders has filled yet. Once an order fills, its cost breakdown appears here.",
    [
      "Task.",
      "This ticket uses a Limit order. Raise its price with the + button until it exceeds ARA, read its price boundaries, then close the ticket without placing the order.",
    ].join(" "),
    "Open the BBCA ticket with Limit",
    "Price guide",
    "Example price row",
    "Stock code",
    "Last price",
    "Change",
    "Quote time",
    "How much does one lot cost?",
    "Find the stock with the largest daily change, then read its code, price, change, and quote time.",
    "Open Market for this task",
    "How to read a stock price",
    "Weight of BBCA",
    "50% BBCA · 50% TLKM",
    "Observed correlation from 60 monthly returns. Move the slider to compare more similar or opposite movements.",
    "Your weighted average asset risk is 4.68% per month, while portfolio risk is 4.07%. The difference is 0.61 percentage points.",
    "Correlation for each stock pair over 60 monthly returns, lowest first.",
    [
      "Task.",
      "Use the pair with the lowest correlation in the chart, then record how many percentage points portfolio risk is below average risk at a weight of 50%.",
    ].join(" "),
    "Curve for BBCA and TLKM at correlation 0.50. Portfolio risk 5.27%, return -0.33% per month.",
    "All weights at ρ 0.50",
    String.raw`σ_p^2 = w_i^2σ_i^2 + w_j^2σ_j^2 + 2w_iw_jρ_{ij}σ_iσ_j \\ = 0.50^2 × 5.23%^2 \\ + 0.50^2 × 6.88%^2 \\ + 2 × 0.50 × 0.50 × 0.50 × 5.23% × 6.88%`,
    String.raw`σ_p = \sqrt{σ_p^2}`,
    "= 5.266% per month",
    "Practice",
    "Task. Find the stock with the largest daily change, then read its code, price, change, and quote time.",
    "IDR 1 to below IDR 200",
    "IDR 5,000 and above",
    "IDR 15 to IDR 200",
    "Session 1",
    "Session 1: 9:00 AM to 12:00 PM",
    "Session 1: 9:00 AM to 11:30 AM",
    "Session 2: 1:30 PM to 3:50 PM",
    "Session 2: 2:00 PM to 3:50 PM",
    "The light parts are the pre-opening from 8:45 AM, the pre-closing until 4:00 PM, and the post-closing until 4:15 PM. Times are in WIB.",
    "The purchase fee is 0.15%, the sale fee 0.15%, and sales tax 0.10% of trade value. Each cost is rounded to the nearest rupiah.",
    "Next price IDR 600",
    "1 lot",
    "Buy 1 lot",
    "Sell 1 lot",
    "Fee IDR 89",
    "Fee IDR 89 + tax IDR 60",
    "Your last filled order: buy 35 lots of BMRI at IDR 3,700. Its value is IDR 12,950,000, broker fee IDR 19,425, so the total paid is IDR 12,969,425.",
    "Your last filled order: sell 35 lots of BMRI at IDR 3,700. Its value is IDR 12,950,000, broker fee IDR 19,425, sales tax IDR 12,950, so the total received is IDR 12,917,625.",
    "BBCA is IDR 4,980, quoted at Oct 30, 2026, 4:14 PM.",
    "For trading day November 2, 2026, reference price IDR 4,980 gives an order price band from ARB IDR 4,640 to ARA IDR 6,225.",
    "1 lot = 100 shares. At IDR 4,980, 1 lot of BBCA is worth IDR 498,000, plus a broker fee of 0.15%, or IDR 747, for a total of IDR 498,747.",
    "BBCA prices move in steps of IDR 10. This step is called the tick size.",
    "Prices come from Recorded source, with a delay of 10 minutes.",
  ],
};

for (const locale of locales) {
  test(`renders the complete new lessons and price guide in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const content = successValueForTest(
      localizedLearningContent(),
      "Learning pages",
    );
    const practice = lessonPracticeForTest();
    const trading = tradingLessonForTest();
    const pages = [2, 6].map((session) => {
      const lesson = content.sessions.find(
        (entry) => entry.session === session,
      );
      if (lesson === undefined)
        throw new Error("The lesson content is present.");
      return renderMarkupForTest(
        session === 6 ? (
          <LessonTrading
            classId={7 as ClassId}
            lesson={lesson}
            trading={trading}
          >
            {null}
          </LessonTrading>
        ) : (
          <LessonPractice
            classId={7 as ClassId}
            lesson={lesson}
            practice={practice}
          >
            {null}
          </LessonPractice>
        ),
      );
    });
    pages.push(
      renderMarkupForTest(
        <PriceGuideView
          classId={7 as ClassId}
          priceGuide={readPriceGuide()}
          trading={tradingLessonForTest()}
          returnTo={undefined}
        />,
      ),
    );
    const lesson = content.sessions.find((entry) => entry.session === 2);
    if (lesson === undefined) throw new Error("Session 2 exists.");
    vi.mocked(useIsInBrowser).mockReturnValue(true);
    pages.push(
      renderMarkupForTest(
        <LessonPractice
          classId={7 as ClassId}
          lesson={lesson}
          practice={practice}
        >
          {null}
        </LessonPractice>,
      ),
    );
    pages.push(
      renderMarkupForTest(
        <LessonPractice
          classId={7 as ClassId}
          lesson={lesson}
          practice={{
            ...lessonPracticeForTest(cashValuationForTest()),
            simulation: readLessonExample(databaseWithClosesForTest()),
          }}
        >
          {null}
        </LessonPractice>,
      ),
    );
    vi.mocked(useIsInBrowser).mockReturnValue(false);
    pages.push(
      renderMarkupForTest(
        <PriceGuideView
          classId={7 as ClassId}
          priceGuide={readPriceGuide()}
          trading={{
            ...trading,
            quote: undefined,
            day: fail({
              kind: "missingRules",
              reason: "Missing recorded date",
            }),
          }}
          returnTo={undefined}
        />,
      ),
    );
    const rates = successValueForTest(
      costRatesOn("2026-11-06"),
      "Recorded fill costs",
    );
    // The sample replays the recorded BMRI close of 6 November at the last continuous minute. By hand, 35 lots cost 12,950,000 before fees.
    for (const side of ["buy", "sell"] as const) {
      const costs = tradeWithCosts(side, rupiah(12950000), rates);
      pages.push(
        renderMarkupForTest(
          <TradingOwnNumbers
            trading={{
              last: {
                code: "BMRI",
                side,
                lots: orderLotsForTest(35),
                fill: {
                  ...costs,
                  price: rupiah(3700),
                  cashChange: cashChange(side, costs),
                  quotedAt: new Date("2026-11-06T08:49:00Z"),
                  filledAt: new Date("2026-11-06T08:49:00Z"),
                },
              },
            }}
          />,
        ),
      );
    }
    for (const task of [2, 6, "prices"] as const)
      pages.push(
        renderMarkupForTest(
          <LessonTaskBanner classId={7 as ClassId} task={task} />,
        ),
      );
    pages.push(
      renderMarkupForTest(
        <TradingLessonPractice
          classId={7 as ClassId}
          trading={{
            ...trading,
            range: fail({
              kind: "noReferenceClose",
              code: "BBCA",
              date: "2026-10-30",
            }),
          }}
          date="2026-11-02"
          idPrefix=""
          taskPage={undefined}
        />,
      ),
    );
    const tradingLesson = content.sessions.find((entry) => entry.session === 6);
    if (tradingLesson === undefined) throw new Error("Session 6 exists.");
    const unavailable = renderMarkupForTest(
      <LessonTrading
        classId={7 as ClassId}
        lesson={tradingLesson}
        trading={{
          ...trading,
          day: fail({ kind: "missingRules", reason: "Missing dated rules" }),
        }}
      >
        {null}
      </LessonTrading>,
    );
    for (const block of tradingLesson.sections.flatMap((section) =>
      section.id === "body" ? section.blocks : [],
    ))
      if (block.kind === "paragraph")
        expect(textOfMarkupForTest(unavailable)).toContain(
          markupTextForTest(block.text),
        );
    expect(unavailable).not.toContain("<table");
    const guideSheet = renderMarkupForTest(
      <PriceGuideView
        classId={7 as ClassId}
        priceGuide={readPriceGuide()}
        trading={trading}
        returnTo="/classes/7/stocks/BBCA"
        inSheet
        idPrefix="guide-"
      />,
    );
    expect(guideSheet).not.toContain("<h1");
    expect(guideSheet).toContain('id="guide-practice"');
    expect(guideSheet).toContain(
      "returnTo=%2Fclasses%2F7%2Fstocks%2FBBCA#practice",
    );
    const guideWithoutQuote = textOfMarkupForTest(
      renderMarkupForTest(
        <PriceGuideView
          classId={7 as ClassId}
          priceGuide={readPriceGuide()}
          trading={{ ...trading, quote: undefined }}
          returnTo={undefined}
        />,
      ),
    );
    expect(guideWithoutQuote.split(tradingDataTexts[locale])).toHaveLength(2);
    const elementTexts = elementTextsForTest(pages.join(""));
    expect(
      texts[locale].filter(
        (expected) => !elementTexts.includes(markupTextForTest(expected)),
      ),
    ).toEqual([]);
    expect(
      learningPriceSourceText({ name: "Recorded source", delayMinutes: 1 }),
    ).toBe(delayTexts[locale]);
    expect(pages[0]).toContain("<svg");
    expect(pages[1]).toContain("priceKind=limit&amp;lessonTask=6");
    expect(pages[2]).toContain("lessonTask=prices");
  });
}
