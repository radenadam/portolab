import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { successValueForTest } from "~/success-value-for-test";
import type { ClassId } from "~/features/classes/classes.schema";
import {
  aadiValuationForTest,
  ammnValuationForTest,
  cashValuationForTest,
  valuationForTest,
} from "~/features/measures/measures-for-test.server";
import { monthlyReturn } from "~/units/monthly-return";
import { LessonPractice } from "./lesson-practice";
import { LessonRiskPractice } from "./lesson-risk-practice";
import { lessonPracticeForTest } from "./lesson-practice-for-test";
import { localizedLearningContent } from "./localized-learning-content.server";
import { practicePortfolio } from "./practice-portfolio";
import { LessonTaskBanner } from "./lesson-task-banner";
import type { LessonPracticeData } from "./lesson-practice-data";

const texts: Record<
  Locale,
  {
    ownCapm: string;
    positiveCapm: string;
    ownRisk: string;
    target: string;
    achievedTarget: string;
    labels: readonly string[];
    tasks: readonly string[];
    inputs: string;
    result: string;
    period: string;
    alphaLabel: string;
    banner: string;
    taskLabel: string;
    capmInputs: string;
    numeric: readonly string[];
    comparisons: readonly string[];
  }
> = {
  id: {
    comparisons: [
      "sekarang -0,22%",
      "sekarang 4,07%",
      "sekarang 0,62",
      "sekarang -0,17",
      "sekarang -1,12%",
      "sekarang ▼ -0,43%",
    ],
    taskLabel: "Tugas.",
    positiveCapm:
      "Beta portofolio Anda 0,30, jadi CAPM meminta 0,28% per bulan. Imbal hasil yang diharapkan 0,75%, sehingga alpha Anda ▲ +0,48%.",
    capmInputs:
      "BI-Rate 5,75% dibagi 12 memberi tingkat bebas risiko 0,479% per bulan. Rata-rata IHSG memakai 60 imbal hasil bulanan.",
    banner: "Tugas · Sesi 10",
    numeric: [
      "0,0006831",
      "0,0002717",
      "0,0004266",
      "0,001653",
      "57,76% / 50,00%",
      "42,24% / 30,00%",
    ],
    alphaLabel: "TLKM -0,63%. Buka perhitungannya",
    ownCapm:
      "Beta portofolio Anda 0,62, jadi CAPM meminta 0,21% per bulan. Imbal hasil yang diharapkan -0,22%, sehingga alpha Anda ▼ -0,43%.",
    ownRisk:
      "Imbal hasil harapan -0,22%, risiko 4,07%, Sharpe -0,17, dan Treynor -1,12% per bulan. Penggeser dimulai dari bobot portofolio Anda sekarang.",
    target:
      "Tugas. Dengan penggeser di atas, turunkan bobot BBCA, penyumbang risiko terbesar, sampai simpangan baku portofolio di bawah 3,66%. Sekarang 4,07%.",
    achievedTarget:
      "Tugas. Dengan penggeser di atas, turunkan bobot BBCA, penyumbang risiko terbesar, sampai simpangan baku portofolio di bawah 3,66%. Sekarang 0,00%.",
    labels: [
      "Geser beta di garis pasar sekuritas",
      "Ubah bobot, lihat ukurannya",
      "Angka Anda",
      "Praktik dengan portofolio Anda",
      "Kembalikan",
      "Dari mana varians berasal",
      "Cari saham pertama Anda",
      "Kembali ke pelajaran",
      "Waktu harga dan pembaruan yang gagal ada di kepemilikan Beranda.",
      "Bagian risiko portofolio Anda dari setiap saham, dibandingkan dengan bobotnya.",
      "Alpha setiap saham Anda per bulan adalah jarak titiknya dari garis pasar sekuritas di grafik atas.",
      "Setiap pasangan yang berbeda masuk dua kali dalam jumlah varians. Korelasi tetap berasal dari bulan yang sama ketika Anda mengubah bobot.",
    ],
    tasks: [
      "Pilih saham dengan alpha paling negatif di daftar ini dan baca perhitungannya. Bagian mana yang membuatnya di bawah garis, imbal hasilnya atau betanya?",
      "Pilih saham dengan alpha terkecil di daftar ini dan baca perhitungannya. Bandingkan imbal hasil harapannya dengan yang disyaratkan CAPM.",
      "Beli saham pertama Anda, lalu kembali ke pelajaran ini setelah order tereksekusi untuk melihat angkanya.",
      "Belum tercapai.",
      "Tercapai. Perhatikan juga apa yang terjadi pada imbal hasil harapan.",
      "Praktik ini memakai portofolio mahasiswa. Contoh memakai data pasar yang tersedia.",
      "Latihan bobot perlu saham yang bersama-sama memiliki cukup imbal hasil bulanan. Baca kebutuhan data pada Angka Anda.",
    ],
    inputs: "Imbal hasil harapan -0,10%, beta 0,69.",
    result: "= 0,219% per bulan",
    period:
      "60 imbal hasil bulanan, Oktober 2021 sampai September 2026. Semua ukuran per bulan.",
  },
  en: {
    comparisons: [
      "current -0.22%",
      "current 4.07%",
      "current 0.62",
      "current -0.17",
      "current -1.12%",
      "current ▼ -0.43%",
    ],
    taskLabel: "Task.",
    positiveCapm:
      "Your portfolio beta is 0.30, so CAPM requires 0.28% per month. Expected return is 0.75%, so your alpha is ▲ +0.48%.",
    capmInputs:
      "BI-Rate 5.75% divided by 12 gives a risk-free rate of 0.479% per month. The IHSG mean uses 60 monthly returns.",
    banner: "Task · Session 10",
    numeric: [
      "0.0006831",
      "0.0002717",
      "0.0004266",
      "0.001653",
      "57.76% / 50.00%",
      "42.24% / 30.00%",
    ],
    alphaLabel: "TLKM -0.63%. Open its calculation",
    ownCapm:
      "Your portfolio beta is 0.62, so CAPM requires 0.21% per month. Expected return is -0.22%, so your alpha is ▼ -0.43%.",
    ownRisk:
      "Expected return is -0.22%, risk 4.07%, Sharpe -0.17, and Treynor -1.12% per month. The sliders start at your current portfolio weights.",
    target:
      "Task. Use the sliders above to lower the weight of BBCA, the largest risk contributor, until portfolio standard deviation is below 3.66%. It is now 4.07%.",
    achievedTarget:
      "Task. Use the sliders above to lower the weight of BBCA, the largest risk contributor, until portfolio standard deviation is below 3.66%. It is now 0.00%.",
    labels: [
      "Move beta along the security market line",
      "Change weights and see the measures",
      "Your numbers",
      "Practise with your portfolio",
      "Reset",
      "Where variance comes from",
      "Find your first stock",
      "Back to the lesson",
      "Quote times and failed updates are in Home holdings.",
      "Each stock’s share of your portfolio risk compared with its weight.",
      "Each stock’s monthly alpha is its point’s distance from the security market line above.",
      "Each pair of different stocks enters the variance sum twice. Correlations still come from the same months when you change weights.",
    ],
    tasks: [
      "Select the stock with the most negative alpha in this list and read its calculation. What puts it below the line, its return or its beta?",
      "Select the stock with the smallest alpha in this list and read its calculation. Compare its expected return with the return CAPM requires.",
      "Buy your first stock, then return to this lesson after the order fills to see your numbers.",
      "Not achieved yet.",
      "Achieved. Observe what also happens to expected return.",
      "This practice uses a student portfolio. The example uses available market data.",
      "The weights exercise needs stocks that share enough monthly returns. Read the data requirements in Your numbers.",
    ],
    inputs: "Expected return -0.10%, beta 0.69.",
    result: "= 0.219% per month",
    period:
      "60 monthly returns, October 2021 to September 2026. All measures are monthly.",
  },
};

function practiceMarkup(session: 9 | 10, practice: LessonPracticeData): string {
  const lesson = successValueForTest(
    localizedLearningContent(),
    "Read content",
  ).sessions.find((entry) => entry.session === session);
  if (lesson === undefined) throw new Error("The content has this lesson.");
  return renderMarkupForTest(
    <LessonPractice classId={7 as ClassId} lesson={lesson} practice={practice}>
      <p>TERMS</p>
    </LessonPractice>,
  );
}

function textOf(markup: string): string {
  return markup.replaceAll(/<[^>]+>/gu, "");
}

for (const locale of locales) {
  const text = texts[locale];
  test(`renders server defaults, the student's numbers, alpha calculations, and risk practice in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const practice = lessonPracticeForTest();
    const capm = practiceMarkup(9, practice);
    const risk = practiceMarkup(10, practice);
    // Python Decimal gives beta 0.6206929, rounded to slider step 0.6, CAPM 0.219077%, and portfolio risk 4.065715%.
    expect(practice.initialBeta).toBeCloseTo(0.6, 14);
    for (const sentence of [
      text.ownCapm,
      text.result,
      text.period,
      text.capmInputs,
    ])
      expect(textOf(capm)).toContain(markupTextForTest(sentence));
    for (const sentence of [
      text.ownRisk,
      text.target,
      text.inputs,
      ...text.comparisons,
    ])
      expect(textOf(risk)).toContain(markupTextForTest(sentence));
    for (const value of text.numeric) expect(textOf(risk)).toContain(value);
    expect(capm).not.toContain('type="range"');
    expect(capm).toContain("<svg");
    expect(capm).toContain(`<strong>${text.taskLabel}</strong>`);
    expect(risk).toContain("width:57.76%");
    expect(risk).toContain("left:50%");
    expect(capm).toContain('popoverTarget="lesson-alpha-TLKM"');
    expect(capm).toContain('id="lesson-alpha-TLKM"');
    expect(capm).toContain(
      `aria-label="${markupTextForTest(text.alphaLabel)}"`,
    );

    for (const index of [0, 2, 3, 8, 10])
      expect(textOf(capm)).toContain(
        markupTextForTest(text.labels[index] ?? ""),
      );
    for (const index of [1, 2, 3, 5, 9, 11])
      expect(textOf(risk)).toContain(
        markupTextForTest(text.labels[index] ?? ""),
      );
    expect(textOf(capm)).toContain(markupTextForTest(text.tasks[0] ?? ""));
    expect(textOf(risk)).toContain(markupTextForTest(text.tasks[3] ?? ""));
    const own = practicePortfolio(practice.report);
    if (own === undefined) throw new Error("The portfolio has measures.");
    const done = textOf(
      renderMarkupForTest(
        <LessonRiskPractice portfolio={own} current={monthlyReturn(0)} />,
      ),
    );
    expect(done).toContain(markupTextForTest(text.achievedTarget));
    expect(done).toContain(markupTextForTest(text.tasks[4] ?? ""));
  });

  test(`handles no stocks, missing prices, insufficient months, shorter shared periods, and lecturer examples in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const valuation of [
      cashValuationForTest(),
      valuationForTest(["BBCA"]),
      aadiValuationForTest(),
      ammnValuationForTest(),
    ]) {
      const practice = lessonPracticeForTest(valuation);
      const markup = practiceMarkup(9, practice);
      expect(markup).toContain('id="practice"');
      if (practice.report?.kind === "noHoldings") {
        expect(textOf(markup)).toContain(
          markupTextForTest(text.tasks[2] ?? ""),
        );
        expect(markup).toContain('href="/classes/7/market?lessonTask=9"');
        expect(textOf(markup)).toContain(
          markupTextForTest(text.labels[6] ?? ""),
        );
      }
    }
    const shorter = lessonPracticeForTest(ammnValuationForTest());
    expect(shorter.market?.returns).toHaveLength(38);
    // Python Decimal gives portfolio beta 0.2969887, expected return 0.7546137%, CAPM 0.2770972%, and alpha +0.4775166% from the 38 shared months.
    expect(textOf(practiceMarkup(9, shorter))).toContain(
      markupTextForTest(text.positiveCapm),
    );
    expect(textOf(practiceMarkup(9, shorter))).toContain(
      markupTextForTest(text.tasks[1] ?? ""),
    );
    const lecturer = {
      ...lessonPracticeForTest(),
      report: undefined,
      holdings: [],
    };
    expect(textOf(practiceMarkup(9, lecturer))).toContain(
      markupTextForTest(text.tasks[5] ?? ""),
    );
    expect(
      textOf(practiceMarkup(10, { ...lecturer, simulation: undefined })),
    ).toContain(markupTextForTest(text.tasks[6] ?? ""));
    const banner = renderMarkupForTest(
      <LessonTaskBanner classId={7 as ClassId} task={10} />,
    );
    expect(textOf(banner)).toContain(markupTextForTest(text.labels[7] ?? ""));
    expect(banner).toContain('href="/classes/7/learn/10#practice"');
    expect(textOf(banner)).toContain(text.banner);
  });
}
