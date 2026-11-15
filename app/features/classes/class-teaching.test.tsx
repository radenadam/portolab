import { MemoryRouter } from "react-router";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { ClassTeachingCards } from "./class-teaching-cards";
import { formatMarketTime } from "~/formatting";
import { readLessonSessions } from "~/features/learning/read-lesson-sessions.server";
import { expect, test } from "vitest";
import { successValueForTest } from "~/success-value-for-test";
import { parseRecordId } from "~/value-parsers";
import type { UserId } from "~/features/accounts/accounts.schema";
import { beta } from "~/units/beta";
import { cumulativeReturn } from "~/units/cumulative-return";
import { monthlyReturn } from "~/units/monthly-return";
import { rupiah } from "~/units/rupiah";
import type { Locale } from "~/paraglide/runtime.js";
import { languageNames } from "~/language-names";
import { getLocale, locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { addDays } from "~/calendar-dates";
import type { ClassId } from "./classes.schema";
import type { ClassDiscussion, TeachingStudent } from "./class-teaching";
import { classFlags } from "./class-flags";
import { classDiscussion } from "./class-discussion";
import { classSummary } from "./class-summary";
import { classCalendarOf } from "./course-calendar";
import type { SessionNumber } from "./course-calendar";

const lessonSessionsByLocale = new Map<Locale, SessionNumber[]>();

function lessonSessionsForTest(): SessionNumber[] {
  const locale = getLocale();
  const stored = lessonSessionsByLocale.get(locale);
  if (stored !== undefined) return stored;
  const sessions = successValueForTest(
    readLessonSessions(),
    "The lesson catalog is parsed",
  );
  lessonSessionsByLocale.set(locale, sessions);
  return sessions;
}

const parts: Record<Locale, string[]> = {
  id: [
    " Titik kosong di peta.",
    " Satu di antaranya tampil sebagai titik kosong di peta.",
    " Belum pernah memasang order.",
    "Mengapa hampir semua memilih bertahan?",
    "Mengapa hampir semua memilih beta setidaknya sebesar pasar?",
    "Apa yang membedakan kedua kelompok itu?",
  ],
  en: [
    " A hollow point on the map.",
    " Hollow points on the map.",
    " One of them appears as a hollow point on the map.",
    " No order placed yet.",
    "Why has almost everyone chosen a defensive position?",
    "Why has almost everyone chosen beta at least as high as the market?",
    "What distinguishes the two groups?",
  ],
};

// By hand, pooling returns of 2%, 2%, and 8% gives 4%, while their median is 2%. A cash share of 40/102 rounds to 39%, and the dated 5.75% BI-Rate divided by 12 rounds to 0.479% per month.
const expected: Record<Locale, Record<string, unknown>> = {
  id: {
    "flag-empty": [],
    "flag-combined": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2,00%. Kerugian terbesar dan portofolio paling bergejolak di kelas, σ 3% per bulan.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-separate": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2,00%. Kerugian terbesar di kelas, dengan beta 0,80.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "volatile",
        name: "Student 2",
        text: "+2,00%. Portofolio paling bergejolak di kelas, σ 5% per bulan.",
        href: "/classes/1/students?student=2#selected-student",
      },
    ],
    "flag-lossWithoutMeasures": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2,00%. Kerugian terbesar di kelas.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-roundedLoss": [
      {
        key: "volatile",
        name: "Student 1",
        text: "0,00%. Portofolio paling bergejolak di kelas, σ 3% per bulan.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-inactiveLoss": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2,00%. Kerugian terbesar dan portofolio paling bergejolak di kelas, σ 3% per bulan. Tidak aktif sejak 26 Okt 2026, 10.00.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "Belum bertransaksi minggu ini. Titik kosong di peta.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-deletedOrdersLoss": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2,00%. Kerugian terbesar dan portofolio paling bergejolak di kelas, σ 3% per bulan. Belum pernah memasang order.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "Belum bertransaksi minggu ini. Titik kosong di peta.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-noStocks": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Belum punya saham sejak bergabung, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "Belum bertransaksi minggu ini.",
        href: "/classes/1/students?student=3#selected-student",
      },
    ],
    "flag-unfilled": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Belum punya saham karena belum ada order yang terisi, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "Belum bertransaksi minggu ini.",
        href: "/classes/1/students?student=3#selected-student",
      },
    ],
    "flag-sold": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Tidak memegang saham sekarang, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "Belum bertransaksi minggu ini.",
        href: "/classes/1/students?student=3#selected-student",
      },
    ],
    "flag-severalEmpty": [
      {
        key: "no-stocks",
        name: "2 mahasiswa",
        text: "belum memegang saham, jadi tidak tampil di peta.",
        href: "/classes/1/students?filter=no-stocks",
      },
      {
        key: "inactive",
        name: "2 mahasiswa",
        text: "belum bertransaksi minggu ini.",
        href: "/classes/1/students?filter=inactive",
      },
    ],
    "flag-allHollow": [
      {
        key: "volatile",
        name: "Student 2",
        text: "+2,00%. Portofolio paling bergejolak di kelas, σ 5% per bulan. Tidak aktif sejak 26 Okt 2026, 10.00.",
        href: "/classes/1/students?student=2#selected-student",
      },
      {
        key: "inactive",
        name: "2 mahasiswa",
        text: "belum bertransaksi minggu ini. Titik kosong di peta.",
        href: "/classes/1/students?filter=inactive",
      },
    ],
    "flag-oneHollow": [
      {
        key: "volatile",
        name: "Student 1",
        text: "+2,00%. Portofolio paling bergejolak di kelas, σ 3% per bulan. Tidak aktif sejak 26 Okt 2026, 10.00.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "Belum bertransaksi minggu ini. Titik kosong di peta.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-partialOneHollow": [
      {
        key: "volatile",
        name: "Student 1",
        text: "+2,00%. Portofolio paling bergejolak di kelas, σ 3% per bulan. Tidak aktif sejak 26 Okt 2026, 10.00.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Belum punya saham sejak bergabung, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "2 mahasiswa",
        text: "belum bertransaksi minggu ini. Satu di antaranya tampil sebagai titik kosong di peta.",
        href: "/classes/1/students?filter=inactive",
      },
    ],
    "flag-partialSeveralHollow": [
      {
        key: "volatile",
        name: "Student 2",
        text: "+2,00%. Portofolio paling bergejolak di kelas, σ 5% per bulan. Tidak aktif sejak 26 Okt 2026, 10.00.",
        href: "/classes/1/students?student=2#selected-student",
      },
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Belum punya saham sejak bergabung, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "3 mahasiswa",
        text: "belum bertransaksi minggu ini. 2 di antaranya tampil sebagai titik kosong di peta.",
        href: "/classes/1/students?filter=inactive",
      },
    ],
    "flag-unavailableMeasure": [],
    "flag-noFlag": [],
    "question-empty-9": [
      "Belum ada portofolio terukur. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?",
      "Belum ada alpha untuk dibahas. Apa arti alpha positif terhadap garis pasar sekuritas?",
    ],
    "question-one-9": [
      "Satu-satunya portofolio terukur berbeta 0,80. Apa artinya bila IHSG turun 1%?",
      "Alpha satu-satunya portofolio terukur +1,00%. Apa artinya berada di atas garis pasar sekuritas?",
    ],
    "question-unmeasured-9": [
      "Belum ada portofolio terukur. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?",
      "Belum ada alpha untuk dibahas. Apa arti alpha positif terhadap garis pasar sekuritas?",
    ],
    "question-allCalmer-9": [
      "Semua 2 portofolio terukur berbeta di bawah 1,00. Mengapa semua memilih bertahan?",
      "Semua 2 portofolio terukur beralpha positif. Apa artinya berada di atas garis pasar sekuritas?",
    ],
    "question-noneCalmer-9": [
      "Tidak ada dari 2 portofolio terukur yang berbeta di bawah 1,00. Mengapa tidak ada yang memilih beta di bawah pasar?",
      "Semua 2 portofolio terukur beralpha negatif. Apa artinya berada di bawah garis pasar sekuritas?",
    ],
    "question-oneCalmer-9": [
      "1 dari 2 portofolio terukur berbeta di bawah 1,00. Apa yang membedakan kedua kelompok itu?",
      "1 dari 2 portofolio terukur beralpha negatif. Apa artinya berada di bawah garis pasar sekuritas?",
    ],
    "question-mostlyCalmer-9": [
      "3 dari 4 portofolio terukur berbeta di bawah 1,00. Mengapa hampir semua memilih bertahan?",
      "1 dari 4 portofolio terukur beralpha negatif. Apa artinya berada di bawah garis pasar sekuritas?",
    ],
    "question-mostlyVolatile-9": [
      "1 dari 4 portofolio terukur berbeta di bawah 1,00. Mengapa hampir semua memilih beta setidaknya sebesar pasar?",
      "3 dari 4 portofolio terukur beralpha negatif. Apa artinya berada di bawah garis pasar sekuritas?",
    ],
    "question-severalCalmer-9": [
      "2 dari 4 portofolio terukur berbeta di bawah 1,00. Apa yang membedakan kedua kelompok itu?",
      "2 dari 4 portofolio terukur beralpha negatif. Apa artinya berada di bawah garis pasar sekuritas?",
    ],
    "question-negative-9": [
      "Satu-satunya portofolio terukur berbeta 1,20. Apa artinya bila IHSG turun 1%?",
      "Alpha satu-satunya portofolio terukur -1,00%. Apa artinya berada di bawah garis pasar sekuritas?",
    ],
    "question-zero-9": [
      "Satu-satunya portofolio terukur berbeta 0,80. Apa artinya bila IHSG turun 1%?",
      "Alpha satu-satunya portofolio terukur 0,00%. Apa artinya berada pada garis pasar sekuritas?",
    ],
    "question-roundedZero-9": [
      "Satu-satunya portofolio terukur berbeta 0,80. Apa artinya bila IHSG turun 1%?",
      "Alpha satu-satunya portofolio terukur 0,00%. Apa artinya berada pada garis pasar sekuritas?",
    ],
    "question-nonnegative-9": [
      "1 dari 2 portofolio terukur berbeta di bawah 1,00. Apa yang membedakan kedua kelompok itu?",
      "Tidak ada dari 2 portofolio terukur yang beralpha negatif. Apa perbedaan alpha nol dan positif terhadap garis pasar sekuritas?",
    ],
    "question-severalNegative-9": [
      "Tidak ada dari 2 portofolio terukur yang berbeta di bawah 1,00. Mengapa tidak ada yang memilih beta di bawah pasar?",
      "Semua 2 portofolio terukur beralpha negatif. Apa artinya berada di bawah garis pasar sekuritas?",
    ],
    "question-mixedAlpha-9": [
      "1 dari 3 portofolio terukur berbeta di bawah 1,00. Apa yang membedakan kedua kelompok itu?",
      "2 dari 3 portofolio terukur beralpha negatif. Apa artinya berada di bawah garis pasar sekuritas?",
    ],
    "question-empty-10": [
      "Belum ada portofolio terukur. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?",
      "Belum ada imbal hasil dan alpha untuk dibandingkan. Ukuran mana yang paling adil untuk menilai portofolio?",
    ],
    "question-one-10": [
      "Satu-satunya portofolio terukur berbeta 0,80. Apa artinya bila IHSG turun 1%?",
      "Student 1 satu-satunya yang memiliki imbal hasil dan alpha, dengan imbal hasil +2,00% dan alpha +1,00%. Ukuran mana yang lebih adil untuk menilainya?",
    ],
    "question-allCalmer-10": [
      "Semua 2 portofolio terukur berbeta di bawah 1,00. Mengapa semua memilih bertahan?",
      "Student 1 unggul di imbal hasil (+2,00%) dan juga di alpha (+1,00%). Apakah kedua ukuran itu selalu sejalan?",
    ],
    "question-differentLeaders-10": [
      "1 dari 2 portofolio terukur berbeta di bawah 1,00. Apa yang membedakan kedua kelompok itu?",
      "Student 2 unggul di imbal hasil (+3,00%), Student 1 unggul di alpha (+1,00%). Ukuran mana yang lebih adil?",
    ],
    "question-empty-11": [
      "Bagaimana futures indeks bisa melindungi portofolio dengan beta tinggi dan beta rendah?",
      "Bagaimana futures indeks bisa menurunkan beta sebuah portofolio menjadi 0,00?",
    ],
    "question-one-11": [
      "Median imbal hasil IHSG selama periode masing-masing mahasiswa -1,00%. Bila setiap portofolio dilindungi futures IHSG, portofolio mana yang paling berubah, yang berbeta tinggi atau rendah?",
      "Median beta kelas 0,80. Berapa nilai posisi futures indeks yang membuat beta portofolio median menjadi 0,00?",
    ],
    "question-pending-11": [
      "Bagaimana futures indeks bisa melindungi portofolio dengan beta tinggi dan beta rendah?",
      "Bagaimana futures indeks bisa menurunkan beta sebuah portofolio menjadi 0,00?",
    ],
    "question-empty-12": [
      "Belum ada portofolio kelas. Bagaimana imbal hasil gabungan portofolio dihitung sebagai satu reksa dana?",
      "Apa yang berubah pada risiko tidak sistematis bila reksa dana menambah jumlah saham?",
    ],
    "question-one-12": [
      "Satu-satunya portofolio memiliki imbal hasil +2,00%. Apa yang berubah bila portofolio ini menjadi reksa dana dengan investor lain?",
      "Rata-rata portofolio memegang 1,0 kode saham. Apa yang berubah pada risiko tidak sistematis bila jumlah itu dinaikkan seperti di reksa dana saham?",
    ],
    "question-allCalmer-12": [
      "Bila 2 portofolio kelas digabung menjadi reksa dana dengan modal awal yang sama, imbal hasilnya sama dengan median imbal hasil portofolio yang digabung, +2,00%. Kapan rata-rata dan median bisa berbeda?",
      "Rata-rata portofolio memegang 1,0 kode saham. Apa yang berubah pada risiko tidak sistematis bila jumlah itu dinaikkan seperti di reksa dana saham?",
    ],
    "question-differentMean-12": [
      "Bila 3 portofolio kelas digabung menjadi reksa dana dengan modal awal yang sama, imbal hasilnya +4,00%, sedangkan median imbal hasil portofolio yang digabung +2,00%. Mengapa keduanya berbeda?",
      "Rata-rata portofolio memegang 1,0 kode saham. Apa yang berubah pada risiko tidak sistematis bila jumlah itu dinaikkan seperti di reksa dana saham?",
    ],
    "question-pending-12": [
      "Sebagian nilai portofolio belum tersedia. Data apa yang diperlukan untuk menghitung imbal hasil reksa dana gabungan kelas?",
      "Rata-rata portofolio memegang 1,0 kode saham. Apa yang berubah pada risiko tidak sistematis bila jumlah itu dinaikkan seperti di reksa dana saham?",
    ],
    "question-differentHoldings-12": [
      "Bila 2 portofolio kelas digabung menjadi reksa dana dengan modal awal yang sama, imbal hasilnya sama dengan median imbal hasil portofolio yang digabung, +2,00%. Kapan rata-rata dan median bisa berbeda?",
      "Rata-rata portofolio memegang 1,5 kode saham. Apa yang berubah pada risiko tidak sistematis bila jumlah itu dinaikkan seperti di reksa dana saham?",
    ],
    "question-empty-13": [
      "Mengapa opsi atas saham yang bergejolak lebih mahal?",
      "Belum ada imbal hasil untuk dibandingkan. Bagaimana opsi jual bisa membatasi kerugian, dan berapa biayanya?",
    ],
    "question-one-13": [
      "Simpangan baku satu-satunya portofolio terukur 3% per bulan. Mengapa opsi atas portofolio yang lebih bergejolak lebih mahal?",
      "Belum ada mahasiswa dengan imbal hasil tersedia yang rugi. Mengapa investor tetap membeli opsi jual saat portofolionya untung?",
    ],
    "question-allCalmer-13": [
      "Simpangan baku portofolio terukur berkisar dari 3% sampai 3% per bulan. Mengapa opsi atas portofolio yang paling bergejolak lebih mahal?",
      "Belum ada mahasiswa dengan imbal hasil tersedia yang rugi. Mengapa investor tetap membeli opsi jual saat portofolionya untung?",
    ],
    "question-oneLoss-13": [
      "Simpangan baku satu-satunya portofolio terukur 3% per bulan. Mengapa opsi atas portofolio yang lebih bergejolak lebih mahal?",
      "Satu-satunya mahasiswa dengan imbal hasil tersedia sedang rugi. Bagaimana opsi jual bisa membatasi kerugian itu, dan berapa biayanya?",
    ],
    "question-allLosses-13": [
      "Simpangan baku portofolio terukur berkisar dari 3% sampai 5% per bulan. Mengapa opsi atas portofolio yang paling bergejolak lebih mahal?",
      "Semua 2 mahasiswa dengan imbal hasil tersedia rugi. Bagaimana opsi jual bisa membatasi kerugian itu, dan berapa biayanya?",
    ],
    "question-mixedLosses-13": [
      "Simpangan baku portofolio terukur berkisar dari 3% sampai 5% per bulan. Mengapa opsi atas portofolio yang paling bergejolak lebih mahal?",
      "1 dari 2 mahasiswa dengan imbal hasil tersedia rugi. Bagaimana opsi jual bisa membatasi kerugian itu, dan berapa biayanya?",
    ],
    "question-severalLosses-13": [
      "Simpangan baku portofolio terukur berkisar dari 3% sampai 5% per bulan. Mengapa opsi atas portofolio yang paling bergejolak lebih mahal?",
      "2 dari 3 mahasiswa dengan imbal hasil tersedia rugi. Bagaimana opsi jual bisa membatasi kerugian itu, dan berapa biayanya?",
    ],
    "question-pending-13": [
      "Mengapa opsi atas saham yang bergejolak lebih mahal?",
      "Belum ada imbal hasil untuk dibandingkan. Bagaimana opsi jual bisa membatasi kerugian, dan berapa biayanya?",
    ],
    "question-empty-14": [
      "Bagaimana alokasi kas memengaruhi imbal hasil portofolio bila dibandingkan dengan obligasi berkupon?",
      "Tingkat bebas risiko Portolab 0,479% per bulan, dari BI-Rate. Apa yang terjadi pada harga obligasi dan garis pasar sekuritas bila BI-Rate naik?",
    ],
    "question-one-14": [
      "Rata-rata kas di kelas 39% dari nilai portofolio. Berapa tambahan imbal hasil per bulan bila kas itu dipegang dalam obligasi berkupon setara BI-Rate 5,75%?",
      "Tingkat bebas risiko Portolab 0,479% per bulan, dari BI-Rate. Apa yang terjadi pada harga obligasi dan garis pasar sekuritas bila BI-Rate naik?",
    ],
    "question-pending-14": [
      "Bagaimana alokasi kas memengaruhi imbal hasil portofolio bila dibandingkan dengan obligasi berkupon?",
      "Tingkat bebas risiko Portolab 0,479% per bulan, dari BI-Rate. Apa yang terjadi pada harga obligasi dan garis pasar sekuritas bila BI-Rate naik?",
    ],
    "question-deletedHoldings-14": [
      "Bagaimana alokasi kas memengaruhi imbal hasil portofolio bila dibandingkan dengan obligasi berkupon?",
      "Tingkat bebas risiko Portolab 0,479% per bulan, dari BI-Rate. Apa yang terjadi pada harga obligasi dan garis pasar sekuritas bila BI-Rate naik?",
    ],
    "question-differentHoldings-14": [
      "Rata-rata kas di kelas 39% dari nilai portofolio. Berapa tambahan imbal hasil per bulan bila kas itu dipegang dalam obligasi berkupon setara BI-Rate 5,75%?",
      "Tingkat bebas risiko Portolab 0,479% per bulan, dari BI-Rate. Apa yang terjadi pada harga obligasi dan garis pasar sekuritas bila BI-Rate naik?",
    ],
    "session-1": {
      badge: "Sesi 1",
      lesson: 9,
      questions: [
        "Belum ada portofolio terukur. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?",
        "Belum ada alpha untuk dibahas. Apa arti alpha positif terhadap garis pasar sekuritas?",
      ],
    },
    "session-2": {
      badge: "Sesi 2",
      lesson: 9,
      questions: [
        "Belum ada portofolio terukur. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?",
        "Belum ada alpha untuk dibahas. Apa arti alpha positif terhadap garis pasar sekuritas?",
      ],
    },
    "session-3": {
      badge: "Sesi 3",
      lesson: 9,
      questions: [
        "Belum ada portofolio terukur. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?",
        "Belum ada alpha untuk dibahas. Apa arti alpha positif terhadap garis pasar sekuritas?",
      ],
    },
    "session-4": {
      badge: "Sesi 4",
      lesson: 9,
      questions: [
        "Belum ada portofolio terukur. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?",
        "Belum ada alpha untuk dibahas. Apa arti alpha positif terhadap garis pasar sekuritas?",
      ],
    },
    "session-5": {
      badge: "Sesi 5",
      lesson: 9,
      questions: [
        "Belum ada portofolio terukur. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?",
        "Belum ada alpha untuk dibahas. Apa arti alpha positif terhadap garis pasar sekuritas?",
      ],
    },
    "session-6": {
      badge: "Sesi 6",
      lesson: 9,
      questions: [
        "Belum ada portofolio terukur. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?",
        "Belum ada alpha untuk dibahas. Apa arti alpha positif terhadap garis pasar sekuritas?",
      ],
    },
    "session-7": {
      badge: "Sesi 7",
      questions: [],
      notice:
        "Review proposal penelitian. Sesi ini tidak memiliki materi simulator.",
    },
    "session-8": {
      badge: "Sesi 8",
      questions: [],
      notice:
        "Ujian tengah semester dan proposal penelitian final. Sesi ini tidak memiliki materi simulator.",
    },
    "session-15": {
      badge: "Sesi 15",
      questions: [],
      notice:
        "Review artikel ilmiah. Sesi ini tidak memiliki materi simulator.",
    },
    "session-16": {
      badge: "Sesi 16",
      questions: [],
      notice:
        "Ujian akhir semester dan artikel ilmiah final. Sesi ini tidak memiliki materi simulator.",
    },
    "calendar-missing": {
      questions: [],
      notice:
        "Atur tanggal sesi 1 di kalender kelas untuk melihat bahan diskusi minggu ini.",
    },
    "calendar-ahead": {
      questions: [],
      notice: "Bahan diskusi dimulai pada minggu sesi 1.",
    },
    "calendar-over": {
      questions: [],
      notice: "Semester sudah selesai. Buka Belajar untuk meninjau materi.",
    },
    "rate-missing": [
      "Bagaimana alokasi kas memengaruhi imbal hasil portofolio bila dibandingkan dengan obligasi berkupon?",
      "Apa yang terjadi pada harga obligasi dan garis pasar sekuritas bila tingkat bebas risiko naik?",
    ],
  },
  en: {
    "flag-empty": [],
    "flag-combined": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2.00%. The largest loss and the most volatile portfolio in the class, σ 3% per month.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-separate": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2.00%. The largest loss in the class, with beta 0.80.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "volatile",
        name: "Student 2",
        text: "+2.00%. The most volatile portfolio in the class, σ 5% per month.",
        href: "/classes/1/students?student=2#selected-student",
      },
    ],
    "flag-lossWithoutMeasures": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2.00%. The largest loss in the class.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-roundedLoss": [
      {
        key: "volatile",
        name: "Student 1",
        text: "0.00%. The most volatile portfolio in the class, σ 3% per month.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-inactiveLoss": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2.00%. The largest loss and the most volatile portfolio in the class, σ 3% per month. Inactive since Oct 26, 2026, 10:00 AM.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "No order placed this week. A hollow point on the map.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-deletedOrdersLoss": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2.00%. The largest loss and the most volatile portfolio in the class, σ 3% per month. No order placed yet.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "No order placed this week. A hollow point on the map.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-noStocks": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks since joining, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "No order placed this week.",
        href: "/classes/1/students?student=3#selected-student",
      },
    ],
    "flag-unfilled": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks because no order has filled yet, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "No order placed this week.",
        href: "/classes/1/students?student=3#selected-student",
      },
    ],
    "flag-sold": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks held now, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "No order placed this week.",
        href: "/classes/1/students?student=3#selected-student",
      },
    ],
    "flag-severalEmpty": [
      {
        key: "no-stocks",
        name: "2 students",
        text: "hold no stocks, so they do not appear on the map.",
        href: "/classes/1/students?filter=no-stocks",
      },
      {
        key: "inactive",
        name: "2 students",
        text: "have placed no orders this week.",
        href: "/classes/1/students?filter=inactive",
      },
    ],
    "flag-allHollow": [
      {
        key: "volatile",
        name: "Student 2",
        text: "+2.00%. The most volatile portfolio in the class, σ 5% per month. Inactive since Oct 26, 2026, 10:00 AM.",
        href: "/classes/1/students?student=2#selected-student",
      },
      {
        key: "inactive",
        name: "2 students",
        text: "have placed no orders this week. Hollow points on the map.",
        href: "/classes/1/students?filter=inactive",
      },
    ],
    "flag-oneHollow": [
      {
        key: "volatile",
        name: "Student 1",
        text: "+2.00%. The most volatile portfolio in the class, σ 3% per month. Inactive since Oct 26, 2026, 10:00 AM.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "No order placed this week. A hollow point on the map.",
        href: "/classes/1/students?student=1#selected-student",
      },
    ],
    "flag-partialOneHollow": [
      {
        key: "volatile",
        name: "Student 1",
        text: "+2.00%. The most volatile portfolio in the class, σ 3% per month. Inactive since Oct 26, 2026, 10:00 AM.",
        href: "/classes/1/students?student=1#selected-student",
      },
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks since joining, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "2 students",
        text: "have placed no orders this week. One of them appears as a hollow point on the map.",
        href: "/classes/1/students?filter=inactive",
      },
    ],
    "flag-partialSeveralHollow": [
      {
        key: "volatile",
        name: "Student 2",
        text: "+2.00%. The most volatile portfolio in the class, σ 5% per month. Inactive since Oct 26, 2026, 10:00 AM.",
        href: "/classes/1/students?student=2#selected-student",
      },
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks since joining, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#selected-student",
      },
      {
        key: "inactive",
        name: "3 students",
        text: "have placed no orders this week. 2 of them appear as hollow points on the map.",
        href: "/classes/1/students?filter=inactive",
      },
    ],
    "flag-unavailableMeasure": [],
    "flag-noFlag": [],
    "question-empty-9": [
      "No portfolio has risk measures yet. What beta would suit a first portfolio, and why?",
      "There is no alpha to discuss yet. What does positive alpha mean relative to the security market line?",
    ],
    "question-one-9": [
      "The only measured portfolio has a beta of 0.80. What does that mean if IHSG falls 1%?",
      "The only measured portfolio has alpha of +1.00%. What does being above the security market line mean?",
    ],
    "question-unmeasured-9": [
      "No portfolio has risk measures yet. What beta would suit a first portfolio, and why?",
      "There is no alpha to discuss yet. What does positive alpha mean relative to the security market line?",
    ],
    "question-allCalmer-9": [
      "All 2 measured portfolios have beta below 1.00. Why has everyone chosen a defensive position?",
      "All 2 measured portfolios have positive alpha. What does being above the security market line mean?",
    ],
    "question-noneCalmer-9": [
      "None of the 2 measured portfolios has beta below 1.00. Why has nobody chosen beta below the market?",
      "All 2 measured portfolios have negative alpha. What does being below the security market line mean?",
    ],
    "question-oneCalmer-9": [
      "1 of the 2 measured portfolios has beta below 1.00. What distinguishes the two groups?",
      "1 of the 2 measured portfolios has negative alpha. What does being below the security market line mean?",
    ],
    "question-mostlyCalmer-9": [
      "3 of the 4 measured portfolios have beta below 1.00. Why has almost everyone chosen a defensive position?",
      "1 of the 4 measured portfolios has negative alpha. What does being below the security market line mean?",
    ],
    "question-mostlyVolatile-9": [
      "1 of the 4 measured portfolios has beta below 1.00. Why has almost everyone chosen beta at least as high as the market?",
      "3 of the 4 measured portfolios have negative alpha. What does being below the security market line mean?",
    ],
    "question-severalCalmer-9": [
      "2 of the 4 measured portfolios have beta below 1.00. What distinguishes the two groups?",
      "2 of the 4 measured portfolios have negative alpha. What does being below the security market line mean?",
    ],
    "question-negative-9": [
      "The only measured portfolio has a beta of 1.20. What does that mean if IHSG falls 1%?",
      "The only measured portfolio has alpha of -1.00%. What does being below the security market line mean?",
    ],
    "question-zero-9": [
      "The only measured portfolio has a beta of 0.80. What does that mean if IHSG falls 1%?",
      "The only measured portfolio has alpha of 0.00%. What does being on the security market line mean?",
    ],
    "question-roundedZero-9": [
      "The only measured portfolio has a beta of 0.80. What does that mean if IHSG falls 1%?",
      "The only measured portfolio has alpha of 0.00%. What does being on the security market line mean?",
    ],
    "question-nonnegative-9": [
      "1 of the 2 measured portfolios has beta below 1.00. What distinguishes the two groups?",
      "None of the 2 measured portfolios has negative alpha. How do zero and positive alpha differ relative to the security market line?",
    ],
    "question-severalNegative-9": [
      "None of the 2 measured portfolios has beta below 1.00. Why has nobody chosen beta below the market?",
      "All 2 measured portfolios have negative alpha. What does being below the security market line mean?",
    ],
    "question-mixedAlpha-9": [
      "1 of the 3 measured portfolios has beta below 1.00. What distinguishes the two groups?",
      "2 of the 3 measured portfolios have negative alpha. What does being below the security market line mean?",
    ],
    "question-empty-10": [
      "No portfolio has risk measures yet. What beta would suit a first portfolio, and why?",
      "There are no returns and alpha to compare yet. Which measure is fairest for judging a portfolio?",
    ],
    "question-one-10": [
      "The only measured portfolio has a beta of 0.80. What does that mean if IHSG falls 1%?",
      "Student 1 is the only student with both return and alpha, with return of +2.00% and alpha of +1.00%. Which measure is fairer for judging this portfolio?",
    ],
    "question-allCalmer-10": [
      "All 2 measured portfolios have beta below 1.00. Why has everyone chosen a defensive position?",
      "Student 1 leads in return (+2.00%) and alpha (+1.00%). Do the two measures always agree?",
    ],
    "question-differentLeaders-10": [
      "1 of the 2 measured portfolios has beta below 1.00. What distinguishes the two groups?",
      "Student 2 leads in return (+3.00%), while Student 1 leads in alpha (+1.00%). Which measure is fairer?",
    ],
    "question-empty-11": [
      "How could index futures hedge portfolios with high and low beta?",
      "How could index futures bring a portfolio’s beta to 0.00?",
    ],
    "question-one-11": [
      "The median IHSG return over each student’s own period is -1.00%. If every portfolio were hedged with IHSG futures, which would change most, those with high or low beta?",
      "The median class beta is 0.80. What size of index futures position would bring the median portfolio’s beta to 0.00?",
    ],
    "question-pending-11": [
      "How could index futures hedge portfolios with high and low beta?",
      "How could index futures bring a portfolio’s beta to 0.00?",
    ],
    "question-empty-12": [
      "There are no class portfolios yet. How would their combined return be calculated as one mutual fund?",
      "What happens to unsystematic risk when a mutual fund holds more stocks?",
    ],
    "question-one-12": [
      "The only portfolio has a return of +2.00%. What would change if it became a mutual fund with other investors?",
      "The average portfolio holds 1.0 stock code. What happens to unsystematic risk if that number rises as in an equity fund?",
    ],
    "question-allCalmer-12": [
      "If the 2 class portfolios were pooled into a fund with equal starting capital, its return would equal their median return of +2.00%. When could the mean and median differ?",
      "The average portfolio holds 1.0 stock code. What happens to unsystematic risk if that number rises as in an equity fund?",
    ],
    "question-differentMean-12": [
      "If the 3 class portfolios were pooled into a fund with equal starting capital, its return would be +4.00%, while their median return is +2.00%. Why do they differ?",
      "The average portfolio holds 1.0 stock code. What happens to unsystematic risk if that number rises as in an equity fund?",
    ],
    "question-pending-12": [
      "Some portfolio values are unavailable. What data is needed to calculate the return of a combined class fund?",
      "The average portfolio holds 1.0 stock code. What happens to unsystematic risk if that number rises as in an equity fund?",
    ],
    "question-differentHoldings-12": [
      "If the 2 class portfolios were pooled into a fund with equal starting capital, its return would equal their median return of +2.00%. When could the mean and median differ?",
      "The average portfolio holds 1.5 stock codes. What happens to unsystematic risk if that number rises as in an equity fund?",
    ],
    "question-empty-13": [
      "Why are options on volatile stocks more expensive?",
      "There are no returns to compare yet. How could put options limit losses, and what would they cost?",
    ],
    "question-one-13": [
      "The only measured portfolio has a standard deviation of 3% per month. Why are options on a more volatile portfolio more expensive?",
      "No student with an available return has a loss. Why might investors buy put options while their portfolios are profitable?",
    ],
    "question-allCalmer-13": [
      "Measured portfolios have standard deviations from 3% to 3% per month. Why are options on the most volatile portfolio more expensive?",
      "No student with an available return has a loss. Why might investors buy put options while their portfolios are profitable?",
    ],
    "question-oneLoss-13": [
      "The only measured portfolio has a standard deviation of 3% per month. Why are options on a more volatile portfolio more expensive?",
      "The only student with an available return has a loss. How could put options limit that loss, and what would they cost?",
    ],
    "question-allLosses-13": [
      "Measured portfolios have standard deviations from 3% to 5% per month. Why are options on the most volatile portfolio more expensive?",
      "All 2 students with available returns have losses. How could put options limit those losses, and what would they cost?",
    ],
    "question-mixedLosses-13": [
      "Measured portfolios have standard deviations from 3% to 5% per month. Why are options on the most volatile portfolio more expensive?",
      "1 of the 2 students with available returns has a loss. How could put options limit that loss, and what would they cost?",
    ],
    "question-severalLosses-13": [
      "Measured portfolios have standard deviations from 3% to 5% per month. Why are options on the most volatile portfolio more expensive?",
      "2 of the 3 students with available returns have losses. How could put options limit those losses, and what would they cost?",
    ],
    "question-pending-13": [
      "Why are options on volatile stocks more expensive?",
      "There are no returns to compare yet. How could put options limit losses, and what would they cost?",
    ],
    "question-empty-14": [
      "How does a cash allocation affect portfolio return compared with coupon bonds?",
      "Portolab’s risk-free rate is 0.479% per month, from the BI-Rate. What happens to bond prices and the security market line if the BI-Rate rises?",
    ],
    "question-one-14": [
      "Average class cash is 39% of portfolio value. What monthly return would it add if held in bonds with a coupon equal to the BI-Rate of 5.75%?",
      "Portolab’s risk-free rate is 0.479% per month, from the BI-Rate. What happens to bond prices and the security market line if the BI-Rate rises?",
    ],
    "question-pending-14": [
      "How does a cash allocation affect portfolio return compared with coupon bonds?",
      "Portolab’s risk-free rate is 0.479% per month, from the BI-Rate. What happens to bond prices and the security market line if the BI-Rate rises?",
    ],
    "question-deletedHoldings-14": [
      "How does a cash allocation affect portfolio return compared with coupon bonds?",
      "Portolab’s risk-free rate is 0.479% per month, from the BI-Rate. What happens to bond prices and the security market line if the BI-Rate rises?",
    ],
    "question-differentHoldings-14": [
      "Average class cash is 39% of portfolio value. What monthly return would it add if held in bonds with a coupon equal to the BI-Rate of 5.75%?",
      "Portolab’s risk-free rate is 0.479% per month, from the BI-Rate. What happens to bond prices and the security market line if the BI-Rate rises?",
    ],
    "session-1": {
      badge: "Session 1",
      lesson: 9,
      questions: [
        "No portfolio has risk measures yet. What beta would suit a first portfolio, and why?",
        "There is no alpha to discuss yet. What does positive alpha mean relative to the security market line?",
      ],
    },
    "session-2": {
      badge: "Session 2",
      lesson: 9,
      questions: [
        "No portfolio has risk measures yet. What beta would suit a first portfolio, and why?",
        "There is no alpha to discuss yet. What does positive alpha mean relative to the security market line?",
      ],
    },
    "session-3": {
      badge: "Session 3",
      lesson: 9,
      questions: [
        "No portfolio has risk measures yet. What beta would suit a first portfolio, and why?",
        "There is no alpha to discuss yet. What does positive alpha mean relative to the security market line?",
      ],
    },
    "session-4": {
      badge: "Session 4",
      lesson: 9,
      questions: [
        "No portfolio has risk measures yet. What beta would suit a first portfolio, and why?",
        "There is no alpha to discuss yet. What does positive alpha mean relative to the security market line?",
      ],
    },
    "session-5": {
      badge: "Session 5",
      lesson: 9,
      questions: [
        "No portfolio has risk measures yet. What beta would suit a first portfolio, and why?",
        "There is no alpha to discuss yet. What does positive alpha mean relative to the security market line?",
      ],
    },
    "session-6": {
      badge: "Session 6",
      lesson: 9,
      questions: [
        "No portfolio has risk measures yet. What beta would suit a first portfolio, and why?",
        "There is no alpha to discuss yet. What does positive alpha mean relative to the security market line?",
      ],
    },
    "session-7": {
      badge: "Session 7",
      questions: [],
      notice:
        "Review of the research proposal. This session has no simulator lesson.",
    },
    "session-8": {
      badge: "Session 8",
      questions: [],
      notice:
        "Midterm exam and the final research proposal. This session has no simulator lesson.",
    },
    "session-15": {
      badge: "Session 15",
      questions: [],
      notice:
        "Review of the research article. This session has no simulator lesson.",
    },
    "session-16": {
      badge: "Session 16",
      questions: [],
      notice:
        "Final exam and the final research article. This session has no simulator lesson.",
    },
    "calendar-missing": {
      questions: [],
      notice:
        "Set the date of session 1 in the class calendar to see this week’s discussion questions.",
    },
    "calendar-ahead": {
      questions: [],
      notice: "Discussion questions start in the week of session 1.",
    },
    "calendar-over": {
      questions: [],
      notice: "The semester has ended. Open Learn to review the lessons.",
    },
    "rate-missing": [
      "How does a cash allocation affect portfolio return compared with coupon bonds?",
      "What happens to bond prices and the security market line if the risk-free rate rises?",
    ],
  },
};

const measuredRisk = {
  beta: beta(0.8),
  standardDeviation: monthlyReturn(0.03),
  alpha: monthlyReturn(0.01),
};
const teachingStartingCash = rupiah(100_000_000);
const classId = successValueForTest(
  parseRecordId<ClassId>("1", "class"),
  "class id",
);

function student(
  id: number,
  changes: Partial<TeachingStudent> = {},
): TeachingStudent {
  return {
    id: successValueForTest(
      parseRecordId<UserId>(String(id), "student"),
      "student id",
    ),
    name: `Student ${String(id)}`,
    return: cumulativeReturn(0.02),
    risk: {
      beta: beta(0.8),
      standardDeviation: monthlyReturn(0.03),
      alpha: monthlyReturn(0.01),
    },
    holdingCount: 1,
    cash: rupiah(40_000_000),
    value: rupiah(102_000_000),
    orderHistory: "filled",
    ordersThisWeek: 1,
    lastOrder: formatMarketTime(new Date("2026-10-26T03:00:00Z")),
    ...changes,
  };
}

function cohort(students: readonly TeachingStudent[]): TeachingStudent[] {
  return students.map((entry) => {
    const value =
      entry.return === undefined
        ? undefined
        : rupiah(Math.round(teachingStartingCash * (1 + entry.return)));
    return {
      ...entry,
      value,
      cash:
        entry.holdingCount === 0 && value !== undefined ? value : entry.cash,
    };
  });
}

function renderedQuestions(
  discussion: ClassDiscussion,
  students: readonly TeachingStudent[],
): string[] {
  const html = renderTextMarkupForTest(
    <MemoryRouter>
      <ClassTeachingCards
        overview={{ flags: [], reasons: [], discussion, students }}
        classId={classId}
        axis="beta"
      />
    </MemoryRouter>,
  );
  return [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gs)].map(
    (match) => match[1] ?? "",
  );
}

function discussion(
  students: TeachingStudent[],
  session: SessionNumber,
  date = "2026-11-02",
) {
  const members = cohort(students);
  const calendar = classCalendarOf(
    addDays(date, -(session - 1) * 7),
    new Date(`${date}T03:00:00Z`),
  );
  expect(calendar?.week.session).toBe(session);
  const summary = classSummary(
    members.flatMap((entry) =>
      entry.return === undefined
        ? []
        : [{ portfolio: entry.return, market: cumulativeReturn(-0.01) }],
    ),
    members.flatMap((entry) =>
      entry.risk === undefined ? [] : [entry.risk.beta],
    ),
  );
  return classDiscussion(members, {
    calendar,
    summary,
    lessonSessions: lessonSessionsForTest(),
    now: new Date(`${date}T03:00:00Z`),
  });
}

for (const locale of locales) {
  test(`computes every attention and session question branch, including deleted records, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const measured = student(1);
    const unmeasured = student(2, { risk: undefined });
    const loss = student(1, { return: cumulativeReturn(-0.02) });
    const volatile = student(2, {
      risk: {
        beta: beta(1.2),
        standardDeviation: monthlyReturn(0.05),
        alpha: monthlyReturn(-0.01),
      },
    });
    const noStocks = student(3, {
      holdingCount: 0,
      risk: undefined,
      orderHistory: "none",
      ordersThisWeek: 0,
      return: cumulativeReturn(0),
    });
    const outputs: Record<string, unknown> = {};
    const flagCases: Record<string, TeachingStudent[]> = {
      empty: [],
      combined: [loss],
      separate: [loss, volatile],
      lossWithoutMeasures: [{ ...loss, risk: undefined }],
      roundedLoss: [{ ...loss, return: cumulativeReturn(-0.000001) }],
      inactiveLoss: [{ ...loss, ordersThisWeek: 0 }],
      deletedOrdersLoss: [{ ...loss, ordersThisWeek: 0, orderHistory: "none" }],
      noStocks: [noStocks],
      unfilled: [{ ...noStocks, orderHistory: "unfilled" }],
      sold: [{ ...noStocks, orderHistory: "filled" }],
      severalEmpty: [noStocks, { ...noStocks, id: measured.id }],
      allHollow: [
        { ...measured, ordersThisWeek: 0 },
        { ...volatile, ordersThisWeek: 0 },
      ],
      oneHollow: [{ ...measured, ordersThisWeek: 0 }],
      partialOneHollow: [noStocks, { ...measured, ordersThisWeek: 0 }],
      partialSeveralHollow: [
        noStocks,
        { ...measured, ordersThisWeek: 0 },
        { ...volatile, ordersThisWeek: 0 },
      ],
      unavailableMeasure: [unmeasured],
      noFlag: [{ ...unmeasured, ordersThisWeek: 1 }],
    };
    for (const [name, students] of Object.entries(flagCases)) {
      outputs[`flag-${name}`] = classFlags(cohort(students), classId).map(
        ({ key, name: label, text, href }) => ({
          key,
          name: label,
          text,
          href,
        }),
      );
    }
    const questionCases: Record<string, TeachingStudent[]> = {
      empty: [],
      one: [measured],
      unmeasured: [unmeasured],
      pending: [
        { ...measured, return: undefined, value: undefined, risk: undefined },
      ],
      allCalmer: [measured, student(2)],
      noneCalmer: [volatile, { ...volatile, id: measured.id }],
      oneCalmer: [measured, volatile],
      mostlyCalmer: [measured, student(2), student(3), volatile],
      mostlyVolatile: [
        measured,
        volatile,
        { ...volatile, id: student(3).id },
        { ...volatile, id: student(4).id },
      ],
      severalCalmer: [
        measured,
        student(2),
        volatile,
        { ...volatile, id: student(4).id },
      ],
      negative: [{ ...measured, risk: volatile.risk }],
      zero: [
        { ...measured, risk: { ...measuredRisk, alpha: monthlyReturn(0) } },
      ],
      roundedZero: [
        {
          ...measured,
          risk: { ...measuredRisk, alpha: monthlyReturn(-0.000001) },
        },
      ],
      nonnegative: [
        measured,
        {
          ...volatile,
          risk: {
            ...{
              beta: beta(1.2),
              standardDeviation: monthlyReturn(0.05),
              alpha: monthlyReturn(-0.01),
            },
            alpha: monthlyReturn(0),
          },
        },
      ],
      severalNegative: [volatile, { ...volatile, id: measured.id }],
      mixedAlpha: [measured, volatile, { ...volatile, id: student(3).id }],
      differentLeaders: [
        { ...measured, return: cumulativeReturn(0.01) },
        { ...volatile, return: cumulativeReturn(0.03) },
      ],
      differentMean: [
        measured,
        student(2),
        student(3, { return: cumulativeReturn(0.08) }),
      ],
      oneLoss: [loss],
      allLosses: [loss, { ...volatile, return: cumulativeReturn(-0.01) }],
      mixedLosses: [loss, volatile],
      severalLosses: [
        loss,
        { ...volatile, return: cumulativeReturn(-0.01) },
        student(3),
      ],
      differentHoldings: [measured, student(2, { holdingCount: 2 })],
      deletedHoldings: [
        {
          ...measured,
          value: rupiah(0),
          return: cumulativeReturn(-1),
          cash: rupiah(0),
          holdingCount: 0,
          risk: undefined,
        },
      ],
    };
    const sessionCases: Record<9 | 10 | 11 | 12 | 13 | 14, string[]> = {
      9: [
        "empty",
        "one",
        "unmeasured",
        "allCalmer",
        "noneCalmer",
        "oneCalmer",
        "mostlyCalmer",
        "mostlyVolatile",
        "severalCalmer",
        "negative",
        "zero",
        "roundedZero",
        "nonnegative",
        "severalNegative",
        "mixedAlpha",
      ],
      10: ["empty", "one", "allCalmer", "differentLeaders"],
      11: ["empty", "one", "pending"],
      12: [
        "empty",
        "one",
        "allCalmer",
        "differentMean",
        "pending",
        "differentHoldings",
      ],
      13: [
        "empty",
        "one",
        "allCalmer",
        "oneLoss",
        "allLosses",
        "mixedLosses",
        "severalLosses",
        "pending",
      ],
      14: ["empty", "one", "pending", "deletedHoldings", "differentHoldings"],
    };
    for (const session of [9, 10, 11, 12, 13, 14] as const) {
      for (const name of sessionCases[session]) {
        const students = questionCases[name];
        if (students === undefined)
          throw new Error("The question case is missing.");
        outputs[`question-${name}-${String(session)}`] = renderedQuestions(
          discussion(students, session),
          students,
        );
      }
    }
    for (const session of [1, 2, 3, 4, 5, 6, 7, 8, 15, 16] as const)
      outputs[`session-${String(session)}`] = discussion([], session);
    const summary = classSummary([], []);
    outputs["calendar-missing"] = classDiscussion([], {
      calendar: undefined,
      summary,
      lessonSessions: lessonSessionsForTest(),
      now: new Date("2026-11-02T03:00:00Z"),
    });
    outputs["calendar-ahead"] = classDiscussion([], {
      calendar: classCalendarOf("2026-11-09", new Date("2026-11-02T03:00:00Z")),
      summary,
      lessonSessions: lessonSessionsForTest(),
      now: new Date("2026-11-02T03:00:00Z"),
    });
    outputs["calendar-over"] = classDiscussion([], {
      calendar: classCalendarOf("2026-01-05", new Date("2026-11-02T03:00:00Z")),
      summary,
      lessonSessions: lessonSessionsForTest(),
      now: new Date("2026-11-02T03:00:00Z"),
    });
    outputs["rate-missing"] = discussion([], 14, "2020-01-06").questions;
    expect(outputs).toEqual(expected[locale]);
    for (const part of parts[locale])
      expect(JSON.stringify(outputs)).toContain(part);
  });
}

const completeMedianQuestion: Record<Locale, string> = {
  id: "Bila 3 portofolio kelas digabung menjadi reksa dana dengan modal awal yang sama, imbal hasilnya +4,67%, sedangkan median imbal hasil portofolio yang digabung +4,00%. Mengapa keduanya berbeda?",
  en: "If the 3 class portfolios were pooled into a fund with equal starting capital, its return would be +4.67%, while their median return is +4.00%. Why do they differ?",
};
const futuresPositions: Record<Locale, readonly [string, string]> = {
  id: [
    "Median beta kelas 0,00. Berapa nilai posisi futures indeks yang membuat beta portofolio median menjadi 0,00?",
    "Median beta kelas -0,80. Berapa nilai posisi futures indeks yang membuat beta portofolio median menjadi 0,00?",
  ],
  en: [
    "The median class beta is 0.00. What size of index futures position would bring the median portfolio’s beta to 0.00?",
    "The median class beta is -0.80. What size of index futures position would bring the median portfolio’s beta to 0.00?",
  ],
};
for (const locale of locales) {
  test(`uses every valued student in the fund median and asks about zero and negative beta in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const members = cohort([
      student(1),
      student(2, { return: cumulativeReturn(0.04) }),
      student(3, { return: cumulativeReturn(0.08) }),
    ]);
    const summary = classSummary(
      [{ portfolio: cumulativeReturn(0.02), market: cumulativeReturn(-0.01) }],
      members.flatMap((entry) =>
        entry.risk === undefined ? [] : [entry.risk.beta],
      ),
    );
    expect(summary.medianReturn).toBe(0.02);
    // By hand, 2%, 4%, and 8% have median 4% and mean 14/3%, even when only the first student has a benchmark.
    const questions = classDiscussion(members, {
      calendar: classCalendarOf("2026-08-17", new Date("2026-11-02T03:00:00Z")),
      summary,
      lessonSessions: lessonSessionsForTest(),
      now: new Date("2026-11-02T03:00:00Z"),
    });
    expect(questions.lesson).toBe(12);
    expect(questions.questions[0]).toBe(completeMedianQuestion[locale]);
    for (const [position, value] of [0, -0.8].entries()) {
      const questions = discussion(
        [student(1, { risk: { ...measuredRisk, beta: beta(value) } })],
        11,
      );
      expect(questions.questions[1]).toBe(futuresPositions[locale][position]);
    }
  });
}

const scopedLeaders: Record<Locale, string> = {
  id: "Di antara portofolio terukur, Student 1 unggul di imbal hasil (+2,00%) dan juga di alpha (+1,00%). Apakah kedua ukuran itu selalu sejalan?",
  en: "Among measured portfolios, Student 1 leads in return (+2.00%) and alpha (+1.00%). Do the two measures always agree?",
};
for (const locale of locales) {
  test(`names the measured comparison group when an unmeasured portfolio has a higher return in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const students = [
      student(1),
      student(2),
      student(3, { return: cumulativeReturn(0.08), risk: undefined }),
    ];
    const questions = renderedQuestions(discussion(students, 10), students);
    expect(questions[1]).toBe(scopedLeaders[locale]);
  });
}
