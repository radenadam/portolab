// Students write their own reasons, so two trades of the sample never share one word for word. Each reason describes the experiment of a fictional student and never recommends a stock, as decision 0050 sets.
const purchaseOpenings = [
  (code: string) =>
    `Saya membeli ${code} untuk mulai menyusun portofolio yang seimbang.`,
  (code: string) =>
    `Saya menambah ${code} supaya modal tidak hanya bergantung pada satu saham.`,
  (code: string) =>
    `Saya memilih ${code} untuk membandingkan gerak harganya dengan IHSG.`,
  (code: string) =>
    `Saya masuk ke ${code} sedikit demi sedikit, tidak sekaligus.`,
  (code: string) =>
    `Pembelian ${code} ini bagian dari rencana membagi modal ke beberapa sektor.`,
  (code: string) =>
    `Saya ingin merasakan sendiri naik turunnya ${code} sebelum menambah posisi.`,
  (code: string) =>
    `${code} saya beli untuk melihat pengaruh satu saham terhadap risiko portofolio.`,
  (code: string) =>
    `Saya membeli ${code} dengan porsi kecil karena masih belajar membaca risikonya.`,
  (code: string) =>
    `Saya menaruh sebagian kas di ${code} dan menyisakan sisanya untuk order berikutnya.`,
  (code: string) =>
    `Saya membeli ${code} untuk berlatih menghitung biaya transaksi yang sebenarnya.`,
  (code: string) =>
    `Saya ingin tahu apakah ${code} bergerak searah dengan pasar.`,
  (code: string) =>
    `Saya menyebar modal, dan ${code} mengisi salah satu bagiannya.`,
];

const purchasePlans = [
  "Minggu depan saya bandingkan hasilnya dengan IHSG.",
  "Saya akan mencatat perubahan betanya setiap minggu.",
  "Kalau risikonya terlalu besar, bobotnya akan saya kurangi.",
  "Saya ingin melihat apakah volatilitas portofolio turun.",
  "Alpha Jensen-nya akan saya periksa setelah ada data bulan berikutnya.",
  "Hasilnya akan saya bawa ke diskusi kelas.",
  "Saya belum yakin, jadi ini juga latihan menahan diri.",
  "Saya tidak berencana menjual dalam waktu dekat.",
  "Biaya broker sudah saya hitung sebelum memasang order.",
  "Targetnya bukan untung cepat, tetapi memahami risikonya.",
  "Saya ingin tahu seberapa besar pengaruh sektornya terhadap portofolio.",
  "Saya juga ingin melihat apakah rasio Sharpe portofolio membaik.",
  "Catatan ini untuk mengingat alasan saya kalau harganya turun.",
  "Setelah sebulan, saya akan menilai apakah keputusan ini masuk akal.",
  "Saya penasaran apakah korelasinya dengan saham lain rendah.",
];

// A recipe buys at most this many stocks, so each purchase of every recipe gets its own pair of an opening and a plan.
const purchasesPerRecipe = 5;

/** The reason of the purchase at a position of a recipe. Each recipe below 36 and position below purchasesPerRecipe takes its own pair of an opening and a plan. */
export function samplePurchaseReason(
  code: string,
  recipe: number,
  position: number,
): string {
  const count = recipe * purchasesPerRecipe + position;
  const opening = purchaseOpenings[count % purchaseOpenings.length];
  // The plan moves with every purchase, so the purchases of one recipe never share it, and an opening meets each plan once before count 180.
  const plan =
    purchasePlans[
      (count + Math.floor(count / purchaseOpenings.length)) %
        purchasePlans.length
    ];
  if (opening === undefined || plan === undefined)
    throw new Error("A sample purchase has no reason.");
  return `${opening(code)} ${plan}`;
}

const saleReasons = [
  (code: string) =>
    `Saya mengurangi ${code} supaya bobotnya tidak terlalu besar.`,
  (code: string) =>
    `Saya menjual sebagian ${code} untuk melihat bagaimana kas dan risiko portofolio berubah.`,
  (code: string) =>
    `Saya menjual sebagian ${code} dan ingin membandingkan biaya jual dengan biaya beli.`,
  (code: string) =>
    `Bobot ${code} sudah lebih besar dari rencana awal, jadi sebagian saya jual.`,
  (code: string) =>
    `Saya menjual sebagian ${code} untuk berlatih menghitung pajak penjualan.`,
  (code: string) =>
    `Saya mengambil sebagian kas dari ${code} untuk order berikutnya.`,
  (code: string) =>
    `Saya mengurangi ${code} karena ingin portofolio yang lebih tenang dari pasar.`,
];

const saleNotes = [
  "Sisa posisinya tetap saya pegang.",
  "Hasilnya saya catat untuk diskusi kelas.",
];

/** The reason of a sale by its number among the sales of the sample. Each number below 14 takes its own pair of a sale and a note. */
export function sampleSaleReason(code: string, sale: number): string {
  const reason = saleReasons[sale % saleReasons.length];
  const note =
    saleNotes[Math.floor(sale / saleReasons.length) % saleNotes.length];
  if (reason === undefined || note === undefined)
    throw new Error("A sample sale has no reason.");
  return `${reason(code)} ${note}`;
}

const waitingReasons = [
  (code: string) =>
    `Saya menambah ${code} dalam jumlah kecil dan menunggu harga tertunda berikutnya.`,
  (code: string) =>
    `Order kecil ${code} ini untuk melihat kapan order harga pasar terisi.`,
  (code: string) =>
    `Saya ingin menambah ${code} sedikit lagi tanpa memakai semua kas.`,
  (code: string) =>
    `Saya menambah ${code} karena masih ada kas yang belum terpakai.`,
  (code: string) =>
    `Posisi ${code} saya tambah sedikit supaya bobotnya mendekati rencana awal.`,
  (code: string) =>
    `Saya mencoba menambah ${code} sedikit dulu sebelum memutuskan langkah berikutnya.`,
  (code: string) =>
    `Saya menambah ${code} untuk melihat perubahan beta portofolio setelah order terisi.`,
  (code: string) => `Kas yang tersisa saya pakai sebagian untuk ${code}.`,
  (code: string) =>
    `Saya ingin tahu apakah order ${code} ini terisi pada harga yang saya lihat.`,
];

/** The reason of an open purchase by its number among the open purchases of the sample. Each number below 9 takes its own reason. */
export function sampleWaitingReason(code: string, order: number): string {
  const reason = waitingReasons[order % waitingReasons.length];
  if (reason === undefined) throw new Error("A sample order has no reason.");
  return reason(code);
}

/** The reasons of the orders that end without a fill. The rejected purchase has two paragraphs, as a student may write. */
export const sampleEndedReasons = {
  rejected: (code: string) =>
    `Saya memakai hampir semua kas yang tersedia untuk ${code}.\n\nKalau harga naik sebelum order diperiksa, saya ingin melihat apa yang terjadi.`,
  cancelled: (code: string) =>
    `Saya memasang limit ${code} di bawah harga pasar, tetapi lalu berubah pikiran.`,
  expired: (code: string) =>
    `Saya memasang limit ${code} di bawah harga pasar dan siap menunggu sampai sesi ditutup.`,
};
