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
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-separate": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2,00%. Kerugian terbesar di kelas, dengan beta 0,80.",
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "volatile",
        name: "Student 2",
        text: "+2,00%. Portofolio paling bergejolak di kelas, σ 5% per bulan.",
        href: "/classes/1/students?student=2#student-2",
      },
    ],
    "flag-lossWithoutMeasures": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2,00%. Kerugian terbesar di kelas.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-roundedLoss": [
      {
        key: "volatile",
        name: "Student 1",
        text: "0,00%. Portofolio paling bergejolak di kelas, σ 3% per bulan.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-inactiveLoss": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2,00%. Kerugian terbesar dan portofolio paling bergejolak di kelas, σ 3% per bulan. Tidak aktif sejak 26 Okt 2026, 10.00.",
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "Belum bertransaksi minggu ini. Titik kosong di peta.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-deletedOrdersLoss": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2,00%. Kerugian terbesar dan portofolio paling bergejolak di kelas, σ 3% per bulan. Belum pernah memasang order.",
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "Belum bertransaksi minggu ini. Titik kosong di peta.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-noStocks": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Belum punya saham sejak bergabung, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#student-3",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "Belum bertransaksi minggu ini.",
        href: "/classes/1/students?student=3#student-3",
      },
    ],
    "flag-unfilled": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Belum punya saham karena belum ada order yang terisi, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#student-3",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "Belum bertransaksi minggu ini.",
        href: "/classes/1/students?student=3#student-3",
      },
    ],
    "flag-sold": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Tidak memegang saham sekarang, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#student-3",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "Belum bertransaksi minggu ini.",
        href: "/classes/1/students?student=3#student-3",
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
        href: "/classes/1/students?student=2#student-2",
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
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "Belum bertransaksi minggu ini. Titik kosong di peta.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-partialOneHollow": [
      {
        key: "volatile",
        name: "Student 1",
        text: "+2,00%. Portofolio paling bergejolak di kelas, σ 3% per bulan. Tidak aktif sejak 26 Okt 2026, 10.00.",
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Belum punya saham sejak bergabung, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#student-3",
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
        href: "/classes/1/students?student=2#student-2",
      },
      {
        key: "no-stocks",
        name: "Student 3",
        text: "Belum punya saham sejak bergabung, jadi tidak tampil di peta.",
        href: "/classes/1/students?student=3#student-3",
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
      lesson: 1,
      questions: [
        "Kelas memiliki 0 mahasiswa. Tujuan dan kebutuhan kas apa yang perlu mendasari alokasi portofolio?",
        "Kebutuhan kas dan nilai portofolio apa yang membantu kita menilai alokasi kas portofolio?",
      ],
    },
    "session-2": {
      badge: "Sesi 2",
      lesson: 2,
      questions: [
        "Ukuran risiko tersedia untuk 0 mahasiswa. Bagaimana bobot dan korelasi menentukan risiko portofolio?",
        "Kelas memiliki 0 mahasiswa dengan tepat satu saham. Mengapa jumlah saham saja tidak membuktikan diversifikasi?",
      ],
    },
    "session-3": {
      badge: "Sesi 3",
      lesson: 3,
      questions: [
        "Tingkat diskonto dan periode apa yang memungkinkan kita membandingkan kas hari ini dengan nilai masa depan?",
        "BI-Rate tahunan sebesar 5,75%. Mengapa tingkat diskonto yang sesuai untuk portofolio kelas dapat berbeda darinya?",
      ],
    },
    "session-4": {
      badge: "Sesi 4",
      lesson: 4,
      questions: [
        "Kelas memiliki 0 mahasiswa yang memegang saham. Apa perbedaan membeli saham yang sudah beredar dan memesan saham terbitan baru?",
        "Kelas memiliki 0 mahasiswa. Apa yang dapat dijelaskan IHSG kepada kelas ini tentang pasar, dan apa yang tidak dapat dijelaskannya tentang satu perusahaan?",
      ],
    },
    "session-5": {
      badge: "Sesi 5",
      lesson: 5,
      questions: [
        "Kelas memiliki 0 mahasiswa yang memegang saham. Apa perbedaan hak pemegang saham dan hak pemegang obligasi?",
        "Hak, arus kas, dan risiko apa yang perlu dibandingkan antara saham, obligasi, dan reksa dana?",
      ],
    },
    "session-6": {
      badge: "Sesi 6",
      lesson: 6,
      questions: [
        "Kelas memiliki 0 mahasiswa dengan order tetapi belum ada catatan eksekusi. Bagaimana batas harga dan sesi perdagangan memengaruhi apakah order terisi?",
        "Kelas memasang 0 order minggu ini. Bagaimana biaya broker dan pajak penjualan memengaruhi kas yang diperlukan untuk transaksi?",
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
        "Atur tanggal sesi 1 di Jadwal kuliah untuk melihat bahan diskusi minggu ini.",
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
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-separate": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2.00%. The largest loss in the class, with beta 0.80.",
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "volatile",
        name: "Student 2",
        text: "+2.00%. The most volatile portfolio in the class, σ 5% per month.",
        href: "/classes/1/students?student=2#student-2",
      },
    ],
    "flag-lossWithoutMeasures": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2.00%. The largest loss in the class.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-roundedLoss": [
      {
        key: "volatile",
        name: "Student 1",
        text: "0.00%. The most volatile portfolio in the class, σ 3% per month.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-inactiveLoss": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2.00%. The largest loss and the most volatile portfolio in the class, σ 3% per month. Inactive since Oct 26, 2026, 10:00 AM.",
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "No order placed this week. A hollow point on the map.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-deletedOrdersLoss": [
      {
        key: "loss",
        name: "Student 1",
        text: "-2.00%. The largest loss and the most volatile portfolio in the class, σ 3% per month. No order placed yet.",
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "No order placed this week. A hollow point on the map.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-noStocks": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks since joining, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#student-3",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "No order placed this week.",
        href: "/classes/1/students?student=3#student-3",
      },
    ],
    "flag-unfilled": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks because no order has filled yet, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#student-3",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "No order placed this week.",
        href: "/classes/1/students?student=3#student-3",
      },
    ],
    "flag-sold": [
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks held now, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#student-3",
      },
      {
        key: "inactive",
        name: "Student 3",
        text: "No order placed this week.",
        href: "/classes/1/students?student=3#student-3",
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
        href: "/classes/1/students?student=2#student-2",
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
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "inactive",
        name: "Student 1",
        text: "No order placed this week. A hollow point on the map.",
        href: "/classes/1/students?student=1#student-1",
      },
    ],
    "flag-partialOneHollow": [
      {
        key: "volatile",
        name: "Student 1",
        text: "+2.00%. The most volatile portfolio in the class, σ 3% per month. Inactive since Oct 26, 2026, 10:00 AM.",
        href: "/classes/1/students?student=1#student-1",
      },
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks since joining, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#student-3",
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
        href: "/classes/1/students?student=2#student-2",
      },
      {
        key: "no-stocks",
        name: "Student 3",
        text: "No stocks since joining, so this student does not appear on the map.",
        href: "/classes/1/students?student=3#student-3",
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
      lesson: 1,
      questions: [
        "The class has 0 students. What goals and cash needs should guide portfolio allocation?",
        "What cash needs and portfolio values would help us judge a portfolio’s cash allocation?",
      ],
    },
    "session-2": {
      badge: "Session 2",
      lesson: 2,
      questions: [
        "Risk measures are available for 0 students. How do weights and correlations determine the risk of a portfolio?",
        "The class has 0 students with exactly one stock. Why does stock count alone not establish diversification?",
      ],
    },
    "session-3": {
      badge: "Session 3",
      lesson: 3,
      questions: [
        "What rate and period would let us compare cash today with a future amount?",
        "The annual BI-Rate is 5.75%. Why might a suitable discount rate for class portfolios differ from it?",
      ],
    },
    "session-4": {
      badge: "Session 4",
      lesson: 4,
      questions: [
        "The class has 0 students holding stocks. How does buying an existing stock differ from subscribing to a new issue?",
        "The class has 0 students. What can the IHSG tell this class about the market, and what can it not tell about one company?",
      ],
    },
    "session-5": {
      badge: "Session 5",
      lesson: 5,
      questions: [
        "The class has 0 students holding stocks. How do a shareholder’s rights differ from a bondholder’s rights?",
        "What rights, cash flows, and risks should we compare across stocks, bonds, and funds?",
      ],
    },
    "session-6": {
      badge: "Session 6",
      lesson: 6,
      questions: [
        "The class has 0 students with orders but no recorded fill. How can price limits and trading sessions affect whether an order fills?",
        "The class placed 0 orders this week. How do broker fees and the tax on sales affect the cash needed for a trade?",
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
        "Set the date of session 1 in the Course calendar to see this week’s discussion questions.",
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

const introductoryQuestions: Record<Locale, Record<string, string[]>> = {
  id: {
    "empty-1": [
      "Kelas memiliki 0 mahasiswa. Tujuan dan kebutuhan kas apa yang perlu mendasari alokasi portofolio?",
      "Kebutuhan kas dan nilai portofolio apa yang membantu kita menilai alokasi kas portofolio?",
    ],
    "empty-2": [
      "Ukuran risiko tersedia untuk 0 mahasiswa. Bagaimana bobot dan korelasi menentukan risiko portofolio?",
      "Kelas memiliki 0 mahasiswa dengan tepat satu saham. Mengapa jumlah saham saja tidak membuktikan diversifikasi?",
    ],
    "empty-3": [
      "Tingkat diskonto dan periode apa yang memungkinkan kita membandingkan kas hari ini dengan nilai masa depan?",
      "BI-Rate tahunan sebesar 5,75%. Mengapa tingkat diskonto yang sesuai untuk portofolio kelas dapat berbeda darinya?",
    ],
    "empty-4": [
      "Kelas memiliki 0 mahasiswa yang memegang saham. Apa perbedaan membeli saham yang sudah beredar dan memesan saham terbitan baru?",
      "Kelas memiliki 0 mahasiswa. Apa yang dapat dijelaskan IHSG kepada kelas ini tentang pasar, dan apa yang tidak dapat dijelaskannya tentang satu perusahaan?",
    ],
    "empty-5": [
      "Kelas memiliki 0 mahasiswa yang memegang saham. Apa perbedaan hak pemegang saham dan hak pemegang obligasi?",
      "Hak, arus kas, dan risiko apa yang perlu dibandingkan antara saham, obligasi, dan reksa dana?",
    ],
    "empty-6": [
      "Kelas memiliki 0 mahasiswa dengan order tetapi belum ada catatan eksekusi. Bagaimana batas harga dan sesi perdagangan memengaruhi apakah order terisi?",
      "Kelas memasang 0 order minggu ini. Bagaimana biaya broker dan pajak penjualan memengaruhi kas yang diperlukan untuk transaksi?",
    ],
    "one-1": [
      "Kelas memiliki 1 mahasiswa. Tujuan dan kebutuhan kas apa yang perlu mendasari alokasi portofolio?",
      "Rata-rata kas di kelas 39% dari nilai portofolio. Bagaimana alokasi ini sesuai dengan jangka waktu portofolio?",
    ],
    "one-2": [
      "Ukuran risiko tersedia untuk 1 mahasiswa. Bagaimana bobot dan korelasi menentukan risiko portofolio?",
      "Kelas memiliki 1 mahasiswa dengan tepat satu saham. Mengapa jumlah saham saja tidak membuktikan diversifikasi?",
    ],
    "one-3": [
      "Rata-rata kas di kelas 39% dari nilai portofolio. Tingkat diskonto dan periode apa yang memungkinkan kita membandingkan kas ini dengan nilai masa depan?",
      "BI-Rate tahunan sebesar 5,75%. Mengapa tingkat diskonto yang sesuai untuk portofolio kelas dapat berbeda darinya?",
    ],
    "one-4": [
      "Kelas memiliki 1 mahasiswa yang memegang saham. Apa perbedaan membeli saham yang sudah beredar dan memesan saham terbitan baru?",
      "Kelas memiliki 1 mahasiswa. Apa yang dapat dijelaskan IHSG kepada kelas ini tentang pasar, dan apa yang tidak dapat dijelaskannya tentang satu perusahaan?",
    ],
    "one-5": [
      "Kelas memiliki 1 mahasiswa yang memegang saham. Apa perbedaan hak pemegang saham dan hak pemegang obligasi?",
      "Rata-rata kas di kelas 39% dari nilai portofolio. Risiko apa yang tidak tercakup dalam angka ini saat membandingkan saham, obligasi, dan reksa dana?",
    ],
    "one-6": [
      "Kelas memiliki 0 mahasiswa dengan order tetapi belum ada catatan eksekusi. Bagaimana batas harga dan sesi perdagangan memengaruhi apakah order terisi?",
      "Kelas memasang 1 order minggu ini. Bagaimana biaya broker dan pajak penjualan memengaruhi kas yang diperlukan untuk transaksi?",
    ],
    "several-1": [
      "Kelas memiliki 2 mahasiswa. Tujuan dan kebutuhan kas apa yang perlu mendasari alokasi portofolio?",
      "Rata-rata kas di kelas 39% dari nilai portofolio. Bagaimana alokasi ini sesuai dengan jangka waktu portofolio?",
    ],
    "several-2": [
      "Ukuran risiko tersedia untuk 2 mahasiswa. Bagaimana bobot dan korelasi menentukan risiko portofolio?",
      "Kelas memiliki 2 mahasiswa dengan tepat satu saham. Mengapa jumlah saham saja tidak membuktikan diversifikasi?",
    ],
    "several-3": [
      "Rata-rata kas di kelas 39% dari nilai portofolio. Tingkat diskonto dan periode apa yang memungkinkan kita membandingkan kas ini dengan nilai masa depan?",
      "BI-Rate tahunan sebesar 5,75%. Mengapa tingkat diskonto yang sesuai untuk portofolio kelas dapat berbeda darinya?",
    ],
    "several-4": [
      "Kelas memiliki 2 mahasiswa yang memegang saham. Apa perbedaan membeli saham yang sudah beredar dan memesan saham terbitan baru?",
      "Kelas memiliki 2 mahasiswa. Apa yang dapat dijelaskan IHSG kepada kelas ini tentang pasar, dan apa yang tidak dapat dijelaskannya tentang satu perusahaan?",
    ],
    "several-5": [
      "Kelas memiliki 2 mahasiswa yang memegang saham. Apa perbedaan hak pemegang saham dan hak pemegang obligasi?",
      "Rata-rata kas di kelas 39% dari nilai portofolio. Risiko apa yang tidak tercakup dalam angka ini saat membandingkan saham, obligasi, dan reksa dana?",
    ],
    "several-6": [
      "Kelas memiliki 0 mahasiswa dengan order tetapi belum ada catatan eksekusi. Bagaimana batas harga dan sesi perdagangan memengaruhi apakah order terisi?",
      "Kelas memasang 2 order minggu ini. Bagaimana biaya broker dan pajak penjualan memengaruhi kas yang diperlukan untuk transaksi?",
    ],
    "pending-1": [
      "Kelas memiliki 1 mahasiswa. Tujuan dan kebutuhan kas apa yang perlu mendasari alokasi portofolio?",
      "Kebutuhan kas dan nilai portofolio apa yang membantu kita menilai alokasi kas portofolio?",
    ],
    "pending-2": [
      "Ukuran risiko tersedia untuk 0 mahasiswa. Bagaimana bobot dan korelasi menentukan risiko portofolio?",
      "Kelas memiliki 1 mahasiswa dengan tepat satu saham. Mengapa jumlah saham saja tidak membuktikan diversifikasi?",
    ],
    "pending-3": [
      "Tingkat diskonto dan periode apa yang memungkinkan kita membandingkan kas hari ini dengan nilai masa depan?",
      "BI-Rate tahunan sebesar 5,75%. Mengapa tingkat diskonto yang sesuai untuk portofolio kelas dapat berbeda darinya?",
    ],
    "pending-4": [
      "Kelas memiliki 1 mahasiswa yang memegang saham. Apa perbedaan membeli saham yang sudah beredar dan memesan saham terbitan baru?",
      "Kelas memiliki 1 mahasiswa. Apa yang dapat dijelaskan IHSG kepada kelas ini tentang pasar, dan apa yang tidak dapat dijelaskannya tentang satu perusahaan?",
    ],
    "pending-5": [
      "Kelas memiliki 1 mahasiswa yang memegang saham. Apa perbedaan hak pemegang saham dan hak pemegang obligasi?",
      "Hak, arus kas, dan risiko apa yang perlu dibandingkan antara saham, obligasi, dan reksa dana?",
    ],
    "pending-6": [
      "Kelas memiliki 1 mahasiswa dengan order tetapi belum ada catatan eksekusi. Bagaimana batas harga dan sesi perdagangan memengaruhi apakah order terisi?",
      "Kelas memasang 1 order minggu ini. Bagaimana biaya broker dan pajak penjualan memengaruhi kas yang diperlukan untuk transaksi?",
    ],
    "cashOnly-1": [
      "Kelas memiliki 2 mahasiswa. Tujuan dan kebutuhan kas apa yang perlu mendasari alokasi portofolio?",
      "Rata-rata kas di kelas 100% dari nilai portofolio. Bagaimana alokasi ini sesuai dengan jangka waktu portofolio?",
    ],
    "cashOnly-2": [
      "Ukuran risiko tersedia untuk 0 mahasiswa. Bagaimana bobot dan korelasi menentukan risiko portofolio?",
      "Kelas memiliki 0 mahasiswa dengan tepat satu saham. Mengapa jumlah saham saja tidak membuktikan diversifikasi?",
    ],
    "cashOnly-3": [
      "Rata-rata kas di kelas 100% dari nilai portofolio. Tingkat diskonto dan periode apa yang memungkinkan kita membandingkan kas ini dengan nilai masa depan?",
      "BI-Rate tahunan sebesar 5,75%. Mengapa tingkat diskonto yang sesuai untuk portofolio kelas dapat berbeda darinya?",
    ],
    "cashOnly-4": [
      "Kelas memiliki 0 mahasiswa yang memegang saham. Apa perbedaan membeli saham yang sudah beredar dan memesan saham terbitan baru?",
      "Kelas memiliki 2 mahasiswa. Apa yang dapat dijelaskan IHSG kepada kelas ini tentang pasar, dan apa yang tidak dapat dijelaskannya tentang satu perusahaan?",
    ],
    "cashOnly-5": [
      "Kelas memiliki 0 mahasiswa yang memegang saham. Apa perbedaan hak pemegang saham dan hak pemegang obligasi?",
      "Rata-rata kas di kelas 100% dari nilai portofolio. Risiko apa yang tidak tercakup dalam angka ini saat membandingkan saham, obligasi, dan reksa dana?",
    ],
    "cashOnly-6": [
      "Kelas memiliki 2 mahasiswa dengan order tetapi belum ada catatan eksekusi. Bagaimana batas harga dan sesi perdagangan memengaruhi apakah order terisi?",
      "Kelas memasang 0 order minggu ini. Bagaimana biaya broker dan pajak penjualan memengaruhi kas yang diperlukan untuk transaksi?",
    ],
    "zero-1": [
      "Kelas memiliki 1 mahasiswa. Tujuan dan kebutuhan kas apa yang perlu mendasari alokasi portofolio?",
      "Kebutuhan kas dan nilai portofolio apa yang membantu kita menilai alokasi kas portofolio?",
    ],
    "zero-2": [
      "Ukuran risiko tersedia untuk 0 mahasiswa. Bagaimana bobot dan korelasi menentukan risiko portofolio?",
      "Kelas memiliki 0 mahasiswa dengan tepat satu saham. Mengapa jumlah saham saja tidak membuktikan diversifikasi?",
    ],
    "zero-3": [
      "Tingkat diskonto dan periode apa yang memungkinkan kita membandingkan kas hari ini dengan nilai masa depan?",
      "BI-Rate tahunan sebesar 5,75%. Mengapa tingkat diskonto yang sesuai untuk portofolio kelas dapat berbeda darinya?",
    ],
    "zero-4": [
      "Kelas memiliki 0 mahasiswa yang memegang saham. Apa perbedaan membeli saham yang sudah beredar dan memesan saham terbitan baru?",
      "Kelas memiliki 1 mahasiswa. Apa yang dapat dijelaskan IHSG kepada kelas ini tentang pasar, dan apa yang tidak dapat dijelaskannya tentang satu perusahaan?",
    ],
    "zero-5": [
      "Kelas memiliki 0 mahasiswa yang memegang saham. Apa perbedaan hak pemegang saham dan hak pemegang obligasi?",
      "Hak, arus kas, dan risiko apa yang perlu dibandingkan antara saham, obligasi, dan reksa dana?",
    ],
    "zero-6": [
      "Kelas memiliki 0 mahasiswa dengan order tetapi belum ada catatan eksekusi. Bagaimana batas harga dan sesi perdagangan memengaruhi apakah order terisi?",
      "Kelas memasang 1 order minggu ini. Bagaimana biaya broker dan pajak penjualan memengaruhi kas yang diperlukan untuk transaksi?",
    ],
    "rate-missing": [
      "Tingkat diskonto dan periode apa yang memungkinkan kita membandingkan kas hari ini dengan nilai masa depan?",
      "BI-Rate belum tersedia untuk tanggal ini. Bagaimana tingkat diskonto perlu sesuai dengan risiko dan periode arus kas?",
    ],
  },
  en: {
    "empty-1": [
      "The class has 0 students. What goals and cash needs should guide portfolio allocation?",
      "What cash needs and portfolio values would help us judge a portfolio’s cash allocation?",
    ],
    "empty-2": [
      "Risk measures are available for 0 students. How do weights and correlations determine the risk of a portfolio?",
      "The class has 0 students with exactly one stock. Why does stock count alone not establish diversification?",
    ],
    "empty-3": [
      "What rate and period would let us compare cash today with a future amount?",
      "The annual BI-Rate is 5.75%. Why might a suitable discount rate for class portfolios differ from it?",
    ],
    "empty-4": [
      "The class has 0 students holding stocks. How does buying an existing stock differ from subscribing to a new issue?",
      "The class has 0 students. What can the IHSG tell this class about the market, and what can it not tell about one company?",
    ],
    "empty-5": [
      "The class has 0 students holding stocks. How do a shareholder’s rights differ from a bondholder’s rights?",
      "What rights, cash flows, and risks should we compare across stocks, bonds, and funds?",
    ],
    "empty-6": [
      "The class has 0 students with orders but no recorded fill. How can price limits and trading sessions affect whether an order fills?",
      "The class placed 0 orders this week. How do broker fees and the tax on sales affect the cash needed for a trade?",
    ],
    "one-1": [
      "The class has 1 student. What goals and cash needs should guide portfolio allocation?",
      "Average class cash is 39% of portfolio value. How does this allocation fit a portfolio’s time horizon?",
    ],
    "one-2": [
      "Risk measures are available for 1 student. How do weights and correlations determine the risk of a portfolio?",
      "The class has 1 student with exactly one stock. Why does stock count alone not establish diversification?",
    ],
    "one-3": [
      "Average class cash is 39% of portfolio value. What rate and period would let us compare this cash with a future amount?",
      "The annual BI-Rate is 5.75%. Why might a suitable discount rate for class portfolios differ from it?",
    ],
    "one-4": [
      "The class has 1 student holding stocks. How does buying an existing stock differ from subscribing to a new issue?",
      "The class has 1 student. What can the IHSG tell this class about the market, and what can it not tell about one company?",
    ],
    "one-5": [
      "The class has 1 student holding stocks. How do a shareholder’s rights differ from a bondholder’s rights?",
      "Average class cash is 39% of portfolio value. What risks does this figure leave out when comparing stocks, bonds, and funds?",
    ],
    "one-6": [
      "The class has 0 students with orders but no recorded fill. How can price limits and trading sessions affect whether an order fills?",
      "The class placed 1 order this week. How do broker fees and the tax on sales affect the cash needed for a trade?",
    ],
    "several-1": [
      "The class has 2 students. What goals and cash needs should guide portfolio allocation?",
      "Average class cash is 39% of portfolio value. How does this allocation fit a portfolio’s time horizon?",
    ],
    "several-2": [
      "Risk measures are available for 2 students. How do weights and correlations determine the risk of a portfolio?",
      "The class has 2 students with exactly one stock. Why does stock count alone not establish diversification?",
    ],
    "several-3": [
      "Average class cash is 39% of portfolio value. What rate and period would let us compare this cash with a future amount?",
      "The annual BI-Rate is 5.75%. Why might a suitable discount rate for class portfolios differ from it?",
    ],
    "several-4": [
      "The class has 2 students holding stocks. How does buying an existing stock differ from subscribing to a new issue?",
      "The class has 2 students. What can the IHSG tell this class about the market, and what can it not tell about one company?",
    ],
    "several-5": [
      "The class has 2 students holding stocks. How do a shareholder’s rights differ from a bondholder’s rights?",
      "Average class cash is 39% of portfolio value. What risks does this figure leave out when comparing stocks, bonds, and funds?",
    ],
    "several-6": [
      "The class has 0 students with orders but no recorded fill. How can price limits and trading sessions affect whether an order fills?",
      "The class placed 2 orders this week. How do broker fees and the tax on sales affect the cash needed for a trade?",
    ],
    "pending-1": [
      "The class has 1 student. What goals and cash needs should guide portfolio allocation?",
      "What cash needs and portfolio values would help us judge a portfolio’s cash allocation?",
    ],
    "pending-2": [
      "Risk measures are available for 0 students. How do weights and correlations determine the risk of a portfolio?",
      "The class has 1 student with exactly one stock. Why does stock count alone not establish diversification?",
    ],
    "pending-3": [
      "What rate and period would let us compare cash today with a future amount?",
      "The annual BI-Rate is 5.75%. Why might a suitable discount rate for class portfolios differ from it?",
    ],
    "pending-4": [
      "The class has 1 student holding stocks. How does buying an existing stock differ from subscribing to a new issue?",
      "The class has 1 student. What can the IHSG tell this class about the market, and what can it not tell about one company?",
    ],
    "pending-5": [
      "The class has 1 student holding stocks. How do a shareholder’s rights differ from a bondholder’s rights?",
      "What rights, cash flows, and risks should we compare across stocks, bonds, and funds?",
    ],
    "pending-6": [
      "The class has 1 student with orders but no recorded fill. How can price limits and trading sessions affect whether an order fills?",
      "The class placed 1 order this week. How do broker fees and the tax on sales affect the cash needed for a trade?",
    ],
    "cashOnly-1": [
      "The class has 2 students. What goals and cash needs should guide portfolio allocation?",
      "Average class cash is 100% of portfolio value. How does this allocation fit a portfolio’s time horizon?",
    ],
    "cashOnly-2": [
      "Risk measures are available for 0 students. How do weights and correlations determine the risk of a portfolio?",
      "The class has 0 students with exactly one stock. Why does stock count alone not establish diversification?",
    ],
    "cashOnly-3": [
      "Average class cash is 100% of portfolio value. What rate and period would let us compare this cash with a future amount?",
      "The annual BI-Rate is 5.75%. Why might a suitable discount rate for class portfolios differ from it?",
    ],
    "cashOnly-4": [
      "The class has 0 students holding stocks. How does buying an existing stock differ from subscribing to a new issue?",
      "The class has 2 students. What can the IHSG tell this class about the market, and what can it not tell about one company?",
    ],
    "cashOnly-5": [
      "The class has 0 students holding stocks. How do a shareholder’s rights differ from a bondholder’s rights?",
      "Average class cash is 100% of portfolio value. What risks does this figure leave out when comparing stocks, bonds, and funds?",
    ],
    "cashOnly-6": [
      "The class has 2 students with orders but no recorded fill. How can price limits and trading sessions affect whether an order fills?",
      "The class placed 0 orders this week. How do broker fees and the tax on sales affect the cash needed for a trade?",
    ],
    "zero-1": [
      "The class has 1 student. What goals and cash needs should guide portfolio allocation?",
      "What cash needs and portfolio values would help us judge a portfolio’s cash allocation?",
    ],
    "zero-2": [
      "Risk measures are available for 0 students. How do weights and correlations determine the risk of a portfolio?",
      "The class has 0 students with exactly one stock. Why does stock count alone not establish diversification?",
    ],
    "zero-3": [
      "What rate and period would let us compare cash today with a future amount?",
      "The annual BI-Rate is 5.75%. Why might a suitable discount rate for class portfolios differ from it?",
    ],
    "zero-4": [
      "The class has 0 students holding stocks. How does buying an existing stock differ from subscribing to a new issue?",
      "The class has 1 student. What can the IHSG tell this class about the market, and what can it not tell about one company?",
    ],
    "zero-5": [
      "The class has 0 students holding stocks. How do a shareholder’s rights differ from a bondholder’s rights?",
      "What rights, cash flows, and risks should we compare across stocks, bonds, and funds?",
    ],
    "zero-6": [
      "The class has 0 students with orders but no recorded fill. How can price limits and trading sessions affect whether an order fills?",
      "The class placed 1 order this week. How do broker fees and the tax on sales affect the cash needed for a trade?",
    ],
    "rate-missing": [
      "What rate and period would let us compare cash today with a future amount?",
      "BI-Rate is unavailable for this date. How should the discount rate match the risk and period of a cash flow?",
    ],
  },
};

for (const locale of locales) {
  test(`keeps the calendar, discussion topic, and lesson together in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const session of lessonSessionsForTest()) {
      const current = discussion([], session);
      expect(current.lesson).toBe(session);
      expect(current.questions).toHaveLength(2);
    }
    // Deleted fills can leave holdings, and deleted holdings can leave no value.
    const cases: Record<string, TeachingStudent[]> = {
      empty: [],
      one: [student(1)],
      several: [student(1), student(2)],
      pending: [
        student(1, {
          return: undefined,
          risk: undefined,
          holdingCount: 1,
          orderHistory: "unfilled",
        }),
      ],
      cashOnly: [
        student(1, {
          return: cumulativeReturn(0),
          risk: undefined,
          holdingCount: 0,
          orderHistory: "unfilled",
          ordersThisWeek: 0,
        }),
        student(2, {
          return: cumulativeReturn(0),
          risk: undefined,
          holdingCount: 0,
          orderHistory: "unfilled",
          ordersThisWeek: 0,
        }),
      ],
      zero: [
        student(1, {
          return: cumulativeReturn(-1),
          risk: undefined,
          holdingCount: 0,
        }),
      ],
    };
    const outputs: Record<string, string[]> = {};
    for (const [name, students] of Object.entries(cases)) {
      for (const session of [1, 2, 3, 4, 5, 6] as const)
        outputs[`${name}-${String(session)}`] = renderedQuestions(
          discussion(students, session),
          students,
        );
    }
    outputs["rate-missing"] = renderedQuestions(
      discussion([], 3, "2020-01-06"),
      [],
    );
    expect(outputs).toEqual(introductoryQuestions[locale]);
  });
}
