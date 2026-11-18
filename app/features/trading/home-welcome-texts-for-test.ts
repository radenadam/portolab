import type { OnboardingStep } from "./onboarding.ts";
import type { Locale } from "../../paraglide/runtime.js";

export const homeWelcomeTextsForTest: Record<
  Locale,
  {
    greeting: string;
    capital: string;
    cash: string;
    body: string;
    open: string;
    find: string;
    basis: string;
    quote: string;
    guide: string;
    summary: string;
    guideKind: string;
    read: string;
    own: string;
    held: string;
    time: string;
    point: string;
    session: string;
    cashTitle: string;
    impactTitle: string;
    helpTitle: string;
    impactBody: string;
    helpBody: string;
    skip: string;
    back: string;
    next: string;
    start: string;
    progress: Record<OnboardingStep, string>;
    navigation: string;
    startingCash: string;
    history: string;
    zeroCloses: string;
    oneClose: string;
    example: string;
    ownNumber: string;
    beta: string;
    riskFree: string;
    impactRows: readonly [string, string, string];
  }
> = {
  id: {
    greeting: "Selamat datang, 12345",
    capital: "Modal Anda",
    cash: "Rp\u00a0125.000.000",
    body: "Uang virtual untuk membangun portofolio saham LQ45 selama semester ini, dengan harga BEI yang tertunda sekitar 10\u00a0menit.",
    open: "Kenali Portolab",
    find: "Cari saham pertama Anda",
    basis: "Tegak: imbal hasil sejak 30 Okt. Mendatar: beta.",
    quote: "IHSG 30 Okt 2026, 16.00 WIB.",
    guide: "Cara membaca harga saham",
    summary:
      "Satu baris harga menunjukkan kode saham, harga per lembar, perubahan, dan waktu kutipannya.",
    guideKind: "Panduan",
    read: "Mulai membaca",
    own: "Portofolio Anda",
    held: "Saham Anda, ukuran = bobot",
    time: "Grafik waktu",
    point: "Titik",
    session: "Sesi 2 · Portofolio",
    cashTitle: "Rp\u00a0125\u00a0jt untuk berlatih",
    impactTitle: "Lihat dampaknya sebelum membeli",
    helpTitle: "Teori di samping keputusan",
    impactBody:
      "Tiket order menunjukkan perubahan beta, risiko, dan bobot sektor portofolio Anda sebelum Anda menekan Beli.",
    helpBody:
      "Pilih ? di samping istilah untuk arti singkat, angka Anda sendiri, dan cara menghitungnya ulang di spreadsheet.",
    skip: "Lewati",
    back: "Kembali",
    next: "Lanjut",
    start: "Mulai",
    progress: {
      cash: "Langkah 1 dari 3",
      impact: "Langkah 2 dari 3",
      help: "Langkah 3 dari 3",
    },
    navigation: "Langkah pengenalan Portolab",
    startingCash: "Modal awal Anda",
    history: "IHSG, 3 bulan terakhir · penutupan 30 Oktober 2026",
    zeroCloses:
      "Riwayat IHSG berisi 0 penutupan dalam rentang ini, tetapi garis memerlukan 2. Periksa kembali setelah pembaruan riwayat harga menyimpan penutupan yang masih kurang.",
    oneClose:
      "Riwayat IHSG berisi 1 penutupan dalam rentang ini, tetapi garis memerlukan 2. Periksa kembali setelah pembaruan riwayat harga menyimpan penutupan yang masih kurang.",
    example: "Contoh: beli 10% di saham bank",
    ownNumber: "Angka Anda",
    beta: "Beta portofolio Anda belum tersedia karena Anda belum memiliki saham.",
    riskFree: "0,48% per bulan dari BI-Rate 5,75%",
    // Python Decimal: spending 0.1 of a portfolio of 1 on a bank stock with the buy fee of 0.15% gives (0.409 + 0.1 / 1.0015) / (0.9 + 0.1 / 1.0015) = 0.50893 in Financials, which shows as 50.9%.
    impactRows: [
      "Beta 0,65 menjadi 0,68.",
      "Risiko/bln 3,67% menjadi 3,72%.",
      "Bobot Keuangan 40,9% menjadi 50,9%.",
    ],
  },
  en: {
    greeting: "Welcome, 12345",
    capital: "Your capital",
    cash: "IDR\u00a0125,000,000",
    body: "Virtual cash to build an LQ45 stock portfolio during this semester, with IDX prices delayed by about 10\u00a0minutes.",
    open: "Meet Portolab",
    find: "Find your first stock",
    basis: "Vertical: return since Oct 30. Horizontal: beta.",
    quote: "IHSG Oct 30, 2026, 4:00 PM WIB.",
    guide: "How to read a stock price",
    summary:
      "A price row shows the stock code, price per share, change, and quote time.",
    guideKind: "Guide",
    read: "Start reading",
    own: "Your portfolio",
    held: "Your holdings, size = weight",
    time: "Time chart",
    point: "Point",
    session: "Session 2 · Portfolio",
    cashTitle: "IDR\u00a0125M to practise with",
    impactTitle: "See the impact before buying",
    helpTitle: "Theory beside the decision",
    impactBody:
      "The order ticket shows changes to your portfolio beta, risk, and sector weights before you press Buy.",
    helpBody:
      "Choose ? beside a term for a brief meaning, your own number, and how to calculate it again in a spreadsheet.",
    skip: "Skip",
    back: "Back",
    next: "Continue",
    start: "Start",
    progress: {
      cash: "Step 1 of 3",
      impact: "Step 2 of 3",
      help: "Step 3 of 3",
    },
    navigation: "Portolab introduction steps",
    startingCash: "Your starting cash",
    history: "IHSG, last 3 months · close on October 30, 2026",
    zeroCloses:
      "The IHSG history has 0 closes in this range, but the line needs 2. Check again once a price history update supplies the missing closes.",
    oneClose:
      "The IHSG history has 1 close in this range, but the line needs 2. Check again once a price history update supplies the missing close.",
    example: "Example: buy 10% in a bank stock",
    ownNumber: "Your number",
    beta: "Your portfolio beta is unavailable because you do not hold any stocks yet.",
    riskFree: "0.48% per month from a BI-Rate of 5.75%",
    impactRows: [
      "Beta 0.65 becomes 0.68.",
      "Risk/mo 3.67% becomes 3.72%.",
      "Financials weight 40.9% becomes 50.9%.",
    ],
  },
};
