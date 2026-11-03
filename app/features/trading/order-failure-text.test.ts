import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { FillFailure, OrderFailure } from "./order";
import { orderFailureText } from "./order-failure-text";
import { orderLotsForTest } from "./orders-for-test";
import { oneRupiahLimit, rateLimit } from "./price-limits";

// Each failure in the states that shape its sentences: one and several lots or returns, a limit as a rate and as an amount of rupiah, a band of tick sizes with and without an end, one and several open orders that set aside cash or shares, or none, an account with or without shares that it can still sell, one and several open sell orders that add cash, or none, and cash that pays for 1 lot at some price or at none. Intl puts a no-break space after the currency, which the texts write as \u00a0.
// The amounts of money were computed with the decimal module of Python, with a broker fee of 0.15% of the value rounded to a whole rupiah with ROUND_HALF_UP. The highest price of 1 lot is the highest whole price at which 100 shares with their fee cost at most the available cash.

const noSales = { codes: [], orders: 0 };

// A purchase of 1 lot of BBCA at Rp4,980, which costs Rp498,747, by an account whose cash of Rp1,253 is all available.
const oneLotWithLittleCash = {
  kind: "notEnoughCash",
  code: "BBCA",
  lots: orderLotsForTest(1),
  price: rupiah(4_980),
  value: rupiah(498_000),
  fee: rupiah(747),
  tax: rupiah(0),
  cash: rupiah(1_253),
  setAside: { amount: rupiah(0), orders: 0 },
  holdsFreeShares: false,
  sales: noSales,
  availableCash: rupiah(1_253),
  largestLots: lots(0),
  highestLotPrice: rupiah(12),
  minimumPrice: rupiah(1),
} satisfies OrderFailure;

// The same purchase while one open buy order of 1 lot sets aside nearly all of a cash of Rp500,000.
const allCashSetAside = {
  ...oneLotWithLittleCash,
  cash: rupiah(500_000),
  setAside: { amount: rupiah(498_747), orders: 1 },
} satisfies OrderFailure;

// A purchase of 5 lots of BBCA at Rp4,980, which costs Rp2,493,735, while one open buy order of 1 lot sets aside Rp498,747 of a cash of Rp2,500,000.
const cashSetAside = {
  kind: "notEnoughCash",
  code: "BBCA",
  lots: orderLotsForTest(5),
  price: rupiah(4_980),
  value: rupiah(2_490_000),
  fee: rupiah(3_735),
  tax: rupiah(0),
  cash: rupiah(2_500_000),
  setAside: { amount: rupiah(498_747), orders: 1 },
  holdsFreeShares: false,
  sales: noSales,
  availableCash: rupiah(2_001_253),
  largestLots: lots(4),
  highestLotPrice: rupiah(19_982),
  minimumPrice: rupiah(1),
} satisfies OrderFailure;

const failures = {
  missingRules: {
    kind: "missingRules",
    reason: "No recorded IDX rule covers 2027-01-04.",
  },
  missingCosts: {
    kind: "missingCosts",
    reason: "No record of the broker fee covers 2026-10-30.",
  },
  missingUniverse: {
    kind: "missingUniverse",
    reason: "No recorded period of the LQ45 covers 2027-02-01.",
  },
  noPrice: { kind: "noPrice", code: "BBCA" },
  outsideUniverse: {
    kind: "outsideUniverse",
    code: "BREN",
    date: "2026-11-02",
  },
  noHistoryOfMarket: {
    kind: "noPriceHistory",
    code: "BBCA",
    instrument: "IHSG",
  },
  noHistoryOfStock: {
    kind: "noPriceHistory",
    code: "BBCA",
    instrument: "BBCA",
  },
  noReferenceClose: {
    kind: "noReferenceClose",
    code: "BBCA",
    date: "2026-11-02",
  },
  severalReturns: {
    kind: "tooFewReturns",
    code: "AADI",
    count: 21,
    minimum: 24,
    enoughAfterFirstTradingDayOf: "2027-01-01",
  },
  oneReturn: {
    kind: "tooFewReturns",
    code: "AADI",
    count: 1,
    minimum: 24,
    enoughAfterFirstTradingDayOf: "2028-09-01",
  },
  tooManyLots: {
    kind: "tooManyLots",
    lots: orderLotsForTest(50_001),
    maximumLots: lots(50_000),
  },
  limitsAsRates: {
    kind: "outsideLimits",
    code: "BBCA",
    date: "2026-11-02",
    price: rupiah(6_250),
    reference: rupiah(4_980),
    lowest: rupiah(4_640),
    highest: rupiah(6_225),
    upper: rateLimit(2_500),
    lower: rateLimit(700),
  },
  limitsAsAmounts: {
    kind: "outsideLimits",
    code: "GOTO",
    date: "2026-11-02",
    price: rupiah(12),
    reference: rupiah(10),
    lowest: rupiah(9),
    highest: rupiah(11),
    upper: oneRupiahLimit,
    lower: oneRupiahLimit,
  },
  offTick: {
    kind: "offTick",
    price: rupiah(4_985),
    tick: rupiah(10),
    bandFrom: rupiah(2_000),
    nextBandFrom: rupiah(5_000),
    below: rupiah(4_980),
    above: rupiah(4_990),
  },
  offTickOfTopBand: {
    kind: "offTick",
    price: rupiah(5_010),
    tick: rupiah(25),
    bandFrom: rupiah(5_000),
    nextBandFrom: undefined,
    below: rupiah(5_000),
    above: rupiah(5_025),
  },
  cashSetAside,
  severalPurchasesSetAside: {
    ...cashSetAside,
    setAside: { amount: rupiah(997_494), orders: 2 },
    availableCash: rupiah(1_502_506),
    largestLots: lots(3),
    highestLotPrice: rupiah(15_002),
  },
  noAffordableLot: {
    ...oneLotWithLittleCash,
    cash: rupiah(400_000),
    availableCash: rupiah(400_000),
    highestLotPrice: rupiah(3_994),
  },
  belowMinimumPrice: {
    ...oneLotWithLittleCash,
    cash: rupiah(99),
    availableCash: rupiah(99),
    highestLotPrice: rupiah(0),
  },
  oneAffordableLot: {
    ...oneLotWithLittleCash,
    lots: orderLotsForTest(2),
    value: rupiah(996_000),
    fee: rupiah(1_494),
    cash: rupiah(600_000),
    availableCash: rupiah(600_000),
    largestLots: lots(1),
    highestLotPrice: rupiah(5_991),
  },
  allCashSetAside,
  sharesAndCashSetAside: { ...allCashSetAside, holdsFreeShares: true },
  oneSaleAddsCash: {
    ...oneLotWithLittleCash,
    sales: { codes: ["BBCA"], orders: 1 },
  },
  severalSalesAddCash: {
    ...oneLotWithLittleCash,
    sales: { codes: ["BBCA", "TLKM"], orders: 2 },
  },
  oneSaleSetsAsideShares: {
    kind: "notEnoughShares",
    code: "BBCA",
    lots: orderLotsForTest(3),
    heldLots: lots(5),
    setAside: { amount: lots(3), orders: 1 },
  },
  severalSalesSetAsideShares: {
    kind: "notEnoughShares",
    code: "BBCA",
    lots: orderLotsForTest(3),
    heldLots: lots(5),
    setAside: { amount: lots(3), orders: 2 },
  },
  fewerShares: {
    kind: "notEnoughShares",
    code: "BBCA",
    lots: orderLotsForTest(6),
    heldLots: lots(5),
    setAside: { amount: lots(0), orders: 0 },
  },
  noFreeShares: {
    kind: "notEnoughShares",
    code: "BBCA",
    lots: orderLotsForTest(1),
    heldLots: lots(1),
    setAside: { amount: lots(1), orders: 1 },
  },
  noFreeSharesOfSeveralSales: {
    kind: "notEnoughShares",
    code: "BBCA",
    lots: orderLotsForTest(1),
    heldLots: lots(2),
    setAside: { amount: lots(2), orders: 2 },
  },
  noShares: {
    kind: "notEnoughShares",
    code: "BBCA",
    lots: orderLotsForTest(5),
    heldLots: lots(0),
    setAside: { amount: lots(0), orders: 0 },
  },
  oneFreeLot: {
    kind: "notEnoughShares",
    code: "BBCA",
    lots: orderLotsForTest(2),
    heldLots: lots(3),
    setAside: { amount: lots(2), orders: 1 },
  },
  noSharesForOneLot: {
    kind: "notEnoughShares",
    code: "BBCA",
    lots: orderLotsForTest(1),
    heldLots: lots(0),
    setAside: { amount: lots(0), orders: 0 },
  },
  priceRose: {
    kind: "priceRose",
    code: "BBCA",
    lots: orderLotsForTest(20),
    checkedPrice: rupiah(4_980),
    price: rupiah(5_025),
    value: rupiah(10_050_000),
    fee: rupiah(15_075),
    tax: rupiah(0),
    availableCash: rupiah(10_000_000),
  },
  priceRoseByOneLot: {
    kind: "priceRose",
    code: "BBCA",
    lots: orderLotsForTest(1),
    checkedPrice: rupiah(4_980),
    price: rupiah(5_025),
    value: rupiah(502_500),
    fee: rupiah(754),
    tax: rupiah(0),
    availableCash: rupiah(500_000),
  },
} satisfies Record<string, OrderFailure | FillFailure>;

type FailureName = keyof typeof failures;

const texts: Record<Locale, Record<FailureName, string>> = {
  id: {
    missingRules:
      "Portolab belum dapat menerima order ini, karena aturan BEI untuk hari bursa order ini belum tercatat. Beri tahu dosen Anda agar aturan tersebut dapat ditambahkan.",
    missingCosts:
      "Portolab belum dapat menerima order ini, karena tarif biaya broker atau pajak final atas penjualan untuk hari bursa order ini belum tercatat. Beri tahu dosen Anda agar tarif yang belum tercatat itu dapat ditambahkan.",
    missingUniverse:
      "Portolab belum dapat menerima order beli ini, karena daftar saham LQ45 pada hari bursa order ini belum tercatat, padahal di Portolab Anda hanya dapat membeli saham LQ45. Beri tahu dosen Anda agar daftar saham tersebut dapat ditambahkan.",
    noPrice:
      "Portolab belum memiliki harga BBCA, sehingga belum dapat memeriksa order ini. Coba lagi setelah pembaruan harga berikutnya membawa harga BBCA.",
    outsideUniverse:
      "BREN tidak termasuk LQ45 pada 2 November 2026, dan di Portolab Anda hanya dapat membeli saham LQ45 pada hari bursa tersebut. Pilih saham yang termasuk LQ45 pada hari itu.",
    noHistoryOfMarket:
      "Portolab belum menyimpan riwayat harga IHSG selama satu bulan penuh, sehingga belum dapat menghitung apakah BBCA memiliki imbal hasil bulanan yang dibutuhkan ukuran portofolio. Coba lagi setelah pembaruan riwayat harga berikutnya menyimpannya.",
    noHistoryOfStock:
      "Portolab belum menyimpan riwayat harga BBCA selama satu bulan penuh, sehingga belum dapat menghitung apakah BBCA memiliki imbal hasil bulanan yang dibutuhkan ukuran portofolio. Coba lagi setelah pembaruan riwayat harga berikutnya menyimpannya.",
    noReferenceClose:
      "Portolab belum memiliki harga penutupan final BBCA untuk 2 November 2026, padahal BEI menetapkan rentang harga order limit dari harga penutupan terakhir BBCA sebelum hari bursa order ini. Jika BBCA diperdagangkan pada 2 November 2026, pembaruan riwayat harga berikutnya menyimpan harga penutupan itu. Jika tidak, order limit dapat dipasang setelah BBCA kembali diperdagangkan dalam sesi. Order harga pasar tidak membutuhkan limit.",
    severalReturns:
      "AADI baru memiliki 21 imbal hasil bulanan, sedangkan Portolab menghitung ukuran sebuah portofolio hanya jika setiap sahamnya memiliki 24 imbal hasil bulanan. Jika AADI tetap memiliki harga penutupan di akhir setiap bulan dan tetap termasuk LQ45, Anda dapat membelinya setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama Januari 2027.",
    oneReturn:
      "AADI baru memiliki 1 imbal hasil bulanan, sedangkan Portolab menghitung ukuran sebuah portofolio hanya jika setiap sahamnya memiliki 24 imbal hasil bulanan. Jika AADI tetap memiliki harga penutupan di akhir setiap bulan dan tetap termasuk LQ45, Anda dapat membelinya setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama September 2028.",
    tooManyLots:
      "BEI menerima paling banyak 50.000 lot dalam satu order, sedangkan order ini berisi 50.001 lot. Bagi order ini menjadi beberapa order yang masing-masing berisi paling banyak 50.000 lot.",
    limitsAsRates:
      "BEI menolak harga Rp\u00a06.250 untuk BBCA pada 2 November 2026 karena batas auto rejection, yang mengizinkan harga paling jauh 25% di atas dan 7% di bawah harga acuan Rp\u00a04.980, yang ditetapkan BEI dari harga penutupan terakhir BBCA sebelum hari itu. Pilih harga dari Rp\u00a04.640 sampai Rp\u00a06.225.",
    limitsAsAmounts:
      "BEI menolak harga Rp\u00a012 untuk GOTO pada 2 November 2026 karena batas auto rejection, yang mengizinkan harga paling jauh Rp\u00a01 di atas dan Rp\u00a01 di bawah harga acuan Rp\u00a010, yang ditetapkan BEI dari harga penutupan terakhir GOTO sebelum hari itu. Pilih harga dari Rp\u00a09 sampai Rp\u00a011.",
    offTick:
      "BEI hanya menerima harga dari Rp\u00a02.000 sampai di bawah Rp\u00a05.000 dalam kelipatan Rp\u00a010, yaitu fraksi harga rentang tersebut, sehingga Rp\u00a04.985 bukan harga yang sah. Pilih Rp\u00a04.980 atau Rp\u00a04.990, harga sah yang terdekat.",
    offTickOfTopBand:
      "BEI hanya menerima harga Rp\u00a05.000 ke atas dalam kelipatan Rp\u00a025, yaitu fraksi harga rentang tersebut, sehingga Rp\u00a05.010 bukan harga yang sah. Pilih Rp\u00a05.000 atau Rp\u00a05.025, harga sah yang terdekat.",
    cashSetAside:
      "Membeli 5 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a02.493.735, yaitu Rp\u00a02.490.000 untuk saham dan Rp\u00a03.735 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a02.001.253. Order beli Anda yang masih terbuka menyisihkan Rp\u00a0498.747 dari kas Anda sebesar Rp\u00a02.500.000, dan mengembalikan jumlah itu ke kas Anda yang tersedia jika order tersebut berakhir tanpa tereksekusi. Order terbesar yang dapat dibayar oleh kas Anda yang tersedia pada harga Rp\u00a04.980 adalah 4 lot.",
    severalPurchasesSetAside:
      "Membeli 5 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a02.493.735, yaitu Rp\u00a02.490.000 untuk saham dan Rp\u00a03.735 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a01.502.506. Sebanyak 2 order beli Anda yang masih terbuka menyisihkan Rp\u00a0997.494 dari kas Anda sebesar Rp\u00a02.500.000, dan masing-masing mengembalikan bagiannya ke kas Anda yang tersedia jika order tersebut berakhir tanpa tereksekusi. Order terbesar yang dapat dibayar oleh kas Anda yang tersedia pada harga Rp\u00a04.980 adalah 3 lot.",
    noAffordableLot:
      "Membeli 1 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a0498.747, yaitu Rp\u00a0498.000 untuk saham dan Rp\u00a0747 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a0400.000. Kas Anda yang tersedia hanya cukup untuk membayar 1 lot saham pada harga paling tinggi Rp\u00a03.994.",
    belowMinimumPrice:
      "Membeli 1 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a0498.747, yaitu Rp\u00a0498.000 untuk saham dan Rp\u00a0747 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a099. Kas Anda yang tersedia tidak cukup untuk membayar 1 lot saham apa pun, bahkan pada Rp\u00a01, harga terendah yang diterima BEI.",
    oneAffordableLot:
      "Membeli 2 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a0997.494, yaitu Rp\u00a0996.000 untuk saham dan Rp\u00a01.494 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a0600.000. Order terbesar yang dapat dibayar oleh kas Anda yang tersedia pada harga Rp\u00a04.980 adalah 1 lot.",
    allCashSetAside:
      "Membeli 1 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a0498.747, yaitu Rp\u00a0498.000 untuk saham dan Rp\u00a0747 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a01.253. Order beli Anda yang masih terbuka menyisihkan Rp\u00a0498.747 dari kas Anda sebesar Rp\u00a0500.000, dan mengembalikan jumlah itu ke kas Anda yang tersedia jika order tersebut berakhir tanpa tereksekusi. Kas Anda yang tersedia hanya cukup untuk membayar 1 lot saham pada harga paling tinggi Rp\u00a012.",
    sharesAndCashSetAside:
      "Membeli 1 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a0498.747, yaitu Rp\u00a0498.000 untuk saham dan Rp\u00a0747 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a01.253. Order beli Anda yang masih terbuka menyisihkan Rp\u00a0498.747 dari kas Anda sebesar Rp\u00a0500.000, dan mengembalikan jumlah itu ke kas Anda yang tersedia jika order tersebut berakhir tanpa tereksekusi. Kas Anda yang tersedia hanya cukup untuk membayar 1 lot saham pada harga paling tinggi Rp\u00a012. Menjual saham yang Anda pegang menambah kas Anda yang tersedia, yang masih kurang Rp\u00a0497.494 untuk order ini.",
    oneSaleAddsCash:
      "Membeli 1 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a0498.747, yaitu Rp\u00a0498.000 untuk saham dan Rp\u00a0747 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a01.253. Kas Anda yang tersedia hanya cukup untuk membayar 1 lot saham pada harga paling tinggi Rp\u00a012. Order jual BBCA Anda yang masih terbuka menambah kas Anda yang tersedia saat tereksekusi.",
    severalSalesAddCash:
      "Membeli 1 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a0498.747, yaitu Rp\u00a0498.000 untuk saham dan Rp\u00a0747 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a01.253. Kas Anda yang tersedia hanya cukup untuk membayar 1 lot saham pada harga paling tinggi Rp\u00a012. Sebanyak 2 order jual BBCA dan TLKM Anda yang masih terbuka menambah kas Anda yang tersedia saat tereksekusi.",
    oneSaleSetsAsideShares:
      "Order ini menjual 3 lot BBCA, dan Anda memegang 5 lot. Order jual Anda yang masih terbuka menyisihkan 3 lot BBCA sampai order tersebut tereksekusi atau kedaluwarsa. Anda dapat menjual paling banyak 2 lot.",
    severalSalesSetAsideShares:
      "Order ini menjual 3 lot BBCA, dan Anda memegang 5 lot. Sebanyak 2 order jual Anda yang masih terbuka menyisihkan 3 lot BBCA sampai order tersebut tereksekusi atau kedaluwarsa. Anda dapat menjual paling banyak 2 lot.",
    fewerShares:
      "Order ini menjual 6 lot BBCA, dan Anda memegang 5 lot. Anda dapat menjual paling banyak 5 lot.",
    noFreeShares:
      "Order ini menjual 1 lot BBCA, dan Anda memegang 1 lot. Order jual Anda yang masih terbuka menyisihkan 1 lot BBCA sampai order tersebut tereksekusi atau kedaluwarsa. Anda dapat menjual lebih banyak saham BBCA setelah order tersebut kedaluwarsa.",
    noFreeSharesOfSeveralSales:
      "Order ini menjual 1 lot BBCA, dan Anda memegang 2 lot. Sebanyak 2 order jual Anda yang masih terbuka menyisihkan 2 lot BBCA sampai order tersebut tereksekusi atau kedaluwarsa. Anda dapat menjual lebih banyak saham BBCA setelah salah satu order tersebut kedaluwarsa.",
    noShares:
      "Order ini menjual 5 lot BBCA, sedangkan Anda tidak memegang saham BBCA, dan Anda hanya dapat menjual saham yang Anda pegang. Periksa kembali sahamnya, dan apakah Anda bermaksud membelinya.",
    oneFreeLot:
      "Order ini menjual 2 lot BBCA, dan Anda memegang 3 lot. Order jual Anda yang masih terbuka menyisihkan 2 lot BBCA sampai order tersebut tereksekusi atau kedaluwarsa. Anda dapat menjual paling banyak 1 lot.",
    noSharesForOneLot:
      "Order ini menjual 1 lot BBCA, sedangkan Anda tidak memegang saham BBCA, dan Anda hanya dapat menjual saham yang Anda pegang. Periksa kembali sahamnya, dan apakah Anda bermaksud membelinya.",
    priceRose:
      "Portolab tidak mengeksekusi order harga pasar Anda untuk membeli 20 lot BBCA, karena harganya naik dari Rp\u00a04.980 menjadi Rp\u00a05.025 selama order menunggu. Pada harga Rp\u00a05.025, order tersebut membutuhkan Rp\u00a010.065.075, yaitu Rp\u00a010.050.000 untuk saham dan Rp\u00a015.075 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a010.000.000. Pasang order baru jika Anda masih menginginkan BBCA, dan Portolab memeriksanya pada harga dan kas saat itu.",
    priceRoseByOneLot:
      "Portolab tidak mengeksekusi order harga pasar Anda untuk membeli 1 lot BBCA, karena harganya naik dari Rp\u00a04.980 menjadi Rp\u00a05.025 selama order menunggu. Pada harga Rp\u00a05.025, order tersebut membutuhkan Rp\u00a0503.254, yaitu Rp\u00a0502.500 untuk saham dan Rp\u00a0754 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a0500.000. Pasang order baru jika Anda masih menginginkan BBCA, dan Portolab memeriksanya pada harga dan kas saat itu.",
  },
  en: {
    missingRules:
      "Portolab cannot take this order yet, because it has not recorded the IDX rules for the trading day of the order. Tell your lecturer, so that the rules can be added.",
    missingCosts:
      "Portolab cannot take this order yet, because it lacks a record of the broker fee or of the final tax on sales for the trading day of the order. Tell your lecturer, so that the missing rates can be added.",
    missingUniverse:
      "Portolab cannot take this purchase yet, because it has not recorded which stocks are in the LQ45 on the trading day of the order, and it lets you buy only those stocks. Tell your lecturer, so that the stocks can be added.",
    noPrice:
      "Portolab has no price for BBCA yet, so it cannot check the order. Try again after the next update of prices brings a price for BBCA.",
    outsideUniverse:
      "BREN is not in the LQ45 on November 2, 2026, and Portolab lets you buy only the stocks of the LQ45 of the trading day. Choose a stock that is in the LQ45 on that day.",
    noHistoryOfMarket:
      "Portolab has not stored a complete month of the price history of IHSG yet, so it cannot count whether BBCA has the monthly returns that the measures need. Try again after the next update of the price history stores it.",
    noHistoryOfStock:
      "Portolab has not stored a complete month of the price history of BBCA yet, so it cannot count whether BBCA has the monthly returns that the measures need. Try again after the next update of the price history stores it.",
    noReferenceClose:
      "Portolab has no final close of BBCA for November 2, 2026 yet, and IDX sets the range of prices of a limit order from the latest close of BBCA before the trading day of the order. If BBCA traded on November 2, 2026, the next update of the price history stores that close. If it did not, a limit order is possible once BBCA trades again during a session. A market order needs no limit.",
    severalReturns:
      "AADI has 21 monthly returns, but Portolab computes the measures of a portfolio only when each of its stocks has 24 monthly returns. If AADI keeps a close at the end of every month and stays in the LQ45, you can buy it after the update of the price history that stores the close of the first trading day of January 2027.",
    oneReturn:
      "AADI has 1 monthly return, but Portolab computes the measures of a portfolio only when each of its stocks has 24 monthly returns. If AADI keeps a close at the end of every month and stays in the LQ45, you can buy it after the update of the price history that stores the close of the first trading day of September 2028.",
    tooManyLots:
      "IDX accepts at most 50,000 lots in one order, but this order has 50,001 lots. Split it into orders of at most 50,000 lots each.",
    limitsAsRates:
      "IDX rejects a price of IDR\u00a06,250 for BBCA on November 2, 2026 by its auto rejection limits, which allow a price at most 25% above and 7% below the reference price of IDR\u00a04,980, which IDX sets from the latest close of BBCA before that day. Choose a price from IDR\u00a04,640 to IDR\u00a06,225.",
    limitsAsAmounts:
      "IDX rejects a price of IDR\u00a012 for GOTO on November 2, 2026 by its auto rejection limits, which allow a price at most IDR\u00a01 above and IDR\u00a01 below the reference price of IDR\u00a010, which IDX sets from the latest close of GOTO before that day. Choose a price from IDR\u00a09 to IDR\u00a011.",
    offTick:
      "IDX accepts prices from IDR\u00a02,000 to below IDR\u00a05,000 only in steps of IDR\u00a010, the tick size of that range, so IDR\u00a04,985 is not a valid price. Choose IDR\u00a04,980 or IDR\u00a04,990, the nearest valid prices.",
    offTickOfTopBand:
      "IDX accepts prices of IDR\u00a05,000 and above only in steps of IDR\u00a025, the tick size of that range, so IDR\u00a05,010 is not a valid price. Choose IDR\u00a05,000 or IDR\u00a05,025, the nearest valid prices.",
    cashSetAside:
      "Buying 5 lots of BBCA at IDR\u00a04,980 costs IDR\u00a02,493,735, which is IDR\u00a02,490,000 for the shares and IDR\u00a03,735 for the broker fee, but your available cash is IDR\u00a02,001,253. Your open buy order sets aside IDR\u00a0498,747 of your cash of IDR\u00a02,500,000, and it returns that amount to your available cash if it ends without filling. The largest order that your available cash pays for at IDR\u00a04,980 is 4 lots.",
    severalPurchasesSetAside:
      "Buying 5 lots of BBCA at IDR\u00a04,980 costs IDR\u00a02,493,735, which is IDR\u00a02,490,000 for the shares and IDR\u00a03,735 for the broker fee, but your available cash is IDR\u00a01,502,506. Your 2 open buy orders set aside IDR\u00a0997,494 of your cash of IDR\u00a02,500,000, and each returns its part to your available cash if it ends without filling. The largest order that your available cash pays for at IDR\u00a04,980 is 3 lots.",
    noAffordableLot:
      "Buying 1 lot of BBCA at IDR\u00a04,980 costs IDR\u00a0498,747, which is IDR\u00a0498,000 for the shares and IDR\u00a0747 for the broker fee, but your available cash is IDR\u00a0400,000. Your available cash pays for 1 lot of a stock only at a price of at most IDR\u00a03,994.",
    belowMinimumPrice:
      "Buying 1 lot of BBCA at IDR\u00a04,980 costs IDR\u00a0498,747, which is IDR\u00a0498,000 for the shares and IDR\u00a0747 for the broker fee, but your available cash is IDR\u00a099. Your available cash does not pay for 1 lot of any stock, even at IDR\u00a01, the lowest price that IDX accepts.",
    oneAffordableLot:
      "Buying 2 lots of BBCA at IDR\u00a04,980 costs IDR\u00a0997,494, which is IDR\u00a0996,000 for the shares and IDR\u00a01,494 for the broker fee, but your available cash is IDR\u00a0600,000. The largest order that your available cash pays for at IDR\u00a04,980 is 1 lot.",
    allCashSetAside:
      "Buying 1 lot of BBCA at IDR\u00a04,980 costs IDR\u00a0498,747, which is IDR\u00a0498,000 for the shares and IDR\u00a0747 for the broker fee, but your available cash is IDR\u00a01,253. Your open buy order sets aside IDR\u00a0498,747 of your cash of IDR\u00a0500,000, and it returns that amount to your available cash if it ends without filling. Your available cash pays for 1 lot of a stock only at a price of at most IDR\u00a012.",
    sharesAndCashSetAside:
      "Buying 1 lot of BBCA at IDR\u00a04,980 costs IDR\u00a0498,747, which is IDR\u00a0498,000 for the shares and IDR\u00a0747 for the broker fee, but your available cash is IDR\u00a01,253. Your open buy order sets aside IDR\u00a0498,747 of your cash of IDR\u00a0500,000, and it returns that amount to your available cash if it ends without filling. Your available cash pays for 1 lot of a stock only at a price of at most IDR\u00a012. Selling shares that you hold adds to your available cash, which needs IDR\u00a0497,494 more for this order.",
    oneSaleAddsCash:
      "Buying 1 lot of BBCA at IDR\u00a04,980 costs IDR\u00a0498,747, which is IDR\u00a0498,000 for the shares and IDR\u00a0747 for the broker fee, but your available cash is IDR\u00a01,253. Your available cash pays for 1 lot of a stock only at a price of at most IDR\u00a012. Your open sell order of BBCA adds to your available cash when it fills.",
    severalSalesAddCash:
      "Buying 1 lot of BBCA at IDR\u00a04,980 costs IDR\u00a0498,747, which is IDR\u00a0498,000 for the shares and IDR\u00a0747 for the broker fee, but your available cash is IDR\u00a01,253. Your available cash pays for 1 lot of a stock only at a price of at most IDR\u00a012. Your 2 open sell orders of BBCA and TLKM add to your available cash when they fill.",
    oneSaleSetsAsideShares:
      "This order sells 3 lots of BBCA, and you hold 5 lots. Your open sell order sets aside 3 lots of BBCA until it fills or expires. You can sell at most 2 lots.",
    severalSalesSetAsideShares:
      "This order sells 3 lots of BBCA, and you hold 5 lots. Your 2 open sell orders set aside 3 lots of BBCA until they fill or expire. You can sell at most 2 lots.",
    fewerShares:
      "This order sells 6 lots of BBCA, and you hold 5 lots. You can sell at most 5 lots.",
    noFreeShares:
      "This order sells 1 lot of BBCA, and you hold 1 lot. Your open sell order sets aside 1 lot of BBCA until it fills or expires. You can sell more shares of BBCA once that order expires.",
    noFreeSharesOfSeveralSales:
      "This order sells 1 lot of BBCA, and you hold 2 lots. Your 2 open sell orders set aside 2 lots of BBCA until they fill or expire. You can sell more shares of BBCA once one of those orders expires.",
    noShares:
      "This order sells 5 lots of BBCA, but you hold no shares of BBCA, and you can sell only shares that you hold. Check the stock, and whether you meant to buy it.",
    oneFreeLot:
      "This order sells 2 lots of BBCA, and you hold 3 lots. Your open sell order sets aside 2 lots of BBCA until it fills or expires. You can sell at most 1 lot.",
    noSharesForOneLot:
      "This order sells 1 lot of BBCA, but you hold no shares of BBCA, and you can sell only shares that you hold. Check the stock, and whether you meant to buy it.",
    priceRose:
      "Portolab did not fill your market order to buy 20 lots of BBCA, because the price rose from IDR\u00a04,980 to IDR\u00a05,025 while the order waited. At IDR\u00a05,025 the order costs IDR\u00a010,065,075, which is IDR\u00a010,050,000 for the shares and IDR\u00a015,075 for the broker fee, but your available cash was IDR\u00a010,000,000. Place a new order if you still want BBCA, and Portolab checks it at the price and with the cash of that moment.",
    priceRoseByOneLot:
      "Portolab did not fill your market order to buy 1 lot of BBCA, because the price rose from IDR\u00a04,980 to IDR\u00a05,025 while the order waited. At IDR\u00a05,025 the order costs IDR\u00a0503,254, which is IDR\u00a0502,500 for the shares and IDR\u00a0754 for the broker fee, but your available cash was IDR\u00a0500,000. Place a new order if you still want BBCA, and Portolab checks it at the price and with the cash of that moment.",
  },
};

for (const locale of locales) {
  for (const [name, text] of Object.entries(texts[locale])) {
    test(`explains the failure ${name} with its numbers, its rule, and a next step in ${languageNames[locale]}`, () => {
      switchLocaleForTest(locale);
      expect(orderFailureText(failureNamed(name))).toBe(text);
    });
  }
}

function failureNamed(name: string): OrderFailure | FillFailure {
  for (const [candidate, failure] of Object.entries(failures)) {
    if (candidate === name) {
      return failure;
    }
  }
  throw new Error(`The table of texts names ${name}, which no failure has.`);
}
