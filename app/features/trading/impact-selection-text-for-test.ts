import type { Locale } from "../../paraglide/runtime.js";

export const impactSelectionTextForTest: Record<
  Locale,
  {
    share: string;
    axis: string;
    shareFailure: string;
    axisFailure: string;
    longShare: string;
    longAxis: string;
    empty: string;
    justPast: string;
    farPast: string;
  }
> = {
  id: {
    share: "Bagian portofolio",
    axis: "Sumbu risiko dampak order",
    shareFailure:
      'Kolom "Bagian portofolio" berisi "0.3", tetapi kolom itu hanya menerima "5%", "10%", atau "20%". Pilih salah satunya.',
    axisFailure:
      'Kolom "Sumbu risiko dampak order" menerima "beta" atau "risk", tetapi isinya "BETA". Pilih salah satu sumbu risiko yang tercantum.',
    longShare:
      'Kolom "Bagian portofolio" berisi 8.000 karakter, tetapi hanya menerima "5%", "10%", atau "20%". Pilih salah satunya.',
    longAxis:
      'Kolom "Sumbu risiko dampak order" berisi 8.000 karakter, tetapi hanya menerima "beta" atau "risk". Pilih salah satu sumbu risiko yang tercantum.',
    empty:
      'Kolom "Bagian portofolio" belum berisi pilihan. Pilih "5%", "10%", atau "20%".',
    justPast:
      'Kolom "Bagian portofolio" berisi 8.001 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
    farPast:
      'Kolom "Bagian portofolio" berisi 1.000.000 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
  },
  en: {
    share: "Share of portfolio",
    axis: "Trade impact risk axis",
    shareFailure:
      'The field "Share of portfolio" holds "0.3", but the field takes only "5%", "10%", or "20%". Choose one of them.',
    axisFailure:
      'The field "Trade impact risk axis" takes "beta" or "risk", but it holds "BETA". Choose a listed risk axis.',
    longShare:
      'The field "Share of portfolio" has 8,000 characters, but it takes only "5%", "10%", or "20%". Choose one of them.',
    longAxis:
      'The field "Trade impact risk axis" has 8,000 characters, but it takes "beta" or "risk". Choose a listed risk axis.',
    empty:
      'The field "Share of portfolio" holds no choice yet. Choose "5%", "10%", or "20%".',
    justPast:
      'The field "Share of portfolio" has 8,001 characters, more than this field takes. Fill it in with the text that it asks for.',
    farPast:
      'The field "Share of portfolio" has 1,000,000 characters, more than this field takes. Fill it in with the text that it asks for.',
  },
};
