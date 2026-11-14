import type { TrackedStockCode } from "./tracked-instruments.ts";

/** A sector of IDX-IC, the classification of IDX, that a company of a tracked stock belongs to, as decision 0034 explains. */
export type Sector =
  | "energy"
  | "basicMaterials"
  | "industrials"
  | "consumerNonCyclicals"
  | "consumerCyclicals"
  | "healthcare"
  | "financials"
  | "propertiesAndRealEstate"
  | "technology"
  | "infrastructures";

/** The company behind a stock, as IDX publishes it. */
interface Company {
  /** The name that IDX gives the company, such as "Bank Central Asia Tbk", in the form that decision 0034 sets. */
  name: string;
  sector: Sector;
  /** Where the name and the sector were read, and when. */
  source: string;
}

// Decision 0034 explains why the companies of the first recorded period use copies of what IDX publishes.
const readOn14November2026 =
  "The name from the list of stocks that IDX publishes, as the project NeaByteLab/IDX-API saved it on GitHub on 20 February 2026, and as lembarsaham.com writes it where that list cuts it at 30 characters. The sector of IDX-IC from the profile of the company on lembarsaham.com on 14 November 2026.";

const companies: Record<TrackedStockCode, Company> = {
  AADI: {
    name: "Adaro Andalan Indonesia Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  ADMR: {
    name: "Alamtri Minerals Indonesia Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  ADRO: {
    name: "Alamtri Resources Indonesia Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  AKRA: {
    name: "AKR Corporindo Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  AMMN: {
    name: "Amman Mineral Internasional Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  AMRT: {
    name: "Sumber Alfaria Trijaya Tbk",
    sector: "consumerNonCyclicals",
    source: readOn14November2026,
  },
  ANTM: {
    name: "Aneka Tambang Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  ASII: {
    name: "Astra International Tbk",
    sector: "industrials",
    source: readOn14November2026,
  },
  BBCA: {
    name: "Bank Central Asia Tbk",
    sector: "financials",
    source: readOn14November2026,
  },
  BBNI: {
    name: "Bank Negara Indonesia (Persero) Tbk",
    sector: "financials",
    source: readOn14November2026,
  },
  BBRI: {
    name: "Bank Rakyat Indonesia (Persero) Tbk",
    sector: "financials",
    source: readOn14November2026,
  },
  BBTN: {
    name: "Bank Tabungan Negara (Persero) Tbk",
    sector: "financials",
    source: readOn14November2026,
  },
  BMRI: {
    name: "Bank Mandiri (Persero) Tbk",
    sector: "financials",
    source: readOn14November2026,
  },
  BRPT: {
    name: "Barito Pacific Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  BUMI: {
    name: "Bumi Resources Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  CPIN: {
    name: "Charoen Pokphand Indonesia Tbk",
    sector: "consumerNonCyclicals",
    source: readOn14November2026,
  },
  DEWA: {
    name: "Darma Henwa Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  ELSA: {
    name: "Elnusa Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  EMTK: {
    name: "Elang Mahkota Teknologi Tbk",
    sector: "technology",
    source: readOn14November2026,
  },
  ERAA: {
    name: "Erajaya Swasembada Tbk",
    sector: "consumerCyclicals",
    source:
      "The name and the IDX-IC sector from https://www.idx.id/primary/ListedCompany/GetCompanyProfilesDetail?KodeEmiten=ERAA&language=id-id on 14 November 2026, checked against https://lembarsaham.com/fundamental-saham/emiten/ERAA.",
  },
  ESSA: {
    name: "ESSA Industries Indonesia Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  EXCL: {
    name: "XLSMART Telecom Sejahtera Tbk",
    sector: "infrastructures",
    source: readOn14November2026,
  },
  GGRM: {
    name: "Gudang Garam Tbk",
    sector: "consumerNonCyclicals",
    source:
      "The name and the IDX-IC sector from https://www.idx.id/primary/ListedCompany/GetCompanyProfilesDetail?KodeEmiten=GGRM&language=id-id on 14 November 2026, checked against https://lembarsaham.com/fundamental-saham/emiten/GGRM.",
  },
  GOTO: {
    name: "GoTo Gojek Tokopedia Tbk",
    sector: "technology",
    source: readOn14November2026,
  },
  HRTA: {
    name: "Hartadinata Abadi Tbk",
    sector: "consumerCyclicals",
    source: readOn14November2026,
  },
  ICBP: {
    name: "Indofood CBP Sukses Makmur Tbk",
    sector: "consumerNonCyclicals",
    source: readOn14November2026,
  },
  INCO: {
    name: "Vale Indonesia Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  INDF: {
    name: "Indofood Sukses Makmur Tbk",
    sector: "consumerNonCyclicals",
    source: readOn14November2026,
  },
  INDY: {
    name: "Indika Energy Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  INKP: {
    name: "Indah Kiat Pulp & Paper Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  ISAT: {
    name: "Indosat Tbk",
    sector: "infrastructures",
    source: readOn14November2026,
  },
  ITMG: {
    name: "Indo Tambangraya Megah Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  JPFA: {
    name: "Japfa Comfeed Indonesia Tbk",
    sector: "consumerNonCyclicals",
    source: readOn14November2026,
  },
  KLBF: {
    name: "Kalbe Farma Tbk",
    sector: "healthcare",
    source: readOn14November2026,
  },
  MAPI: {
    name: "Mitra Adiperkasa Tbk",
    sector: "consumerCyclicals",
    source: readOn14November2026,
  },
  MBMA: {
    name: "Merdeka Battery Materials Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  MDKA: {
    name: "Merdeka Copper Gold Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  MEDC: {
    name: "Medco Energi Internasional Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  NCKL: {
    name: "Trimegah Bangun Persada Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  PGAS: {
    name: "Perusahaan Gas Negara (Persero) Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  PGEO: {
    name: "Pertamina Geothermal Energy Tbk",
    sector: "infrastructures",
    source: readOn14November2026,
  },
  PTBA: {
    name: "Bukit Asam Tbk",
    sector: "energy",
    source: readOn14November2026,
  },
  PWON: {
    name: "Pakuwon Jati Tbk",
    sector: "propertiesAndRealEstate",
    source:
      "The name and the IDX-IC sector from https://www.idx.id/primary/ListedCompany/GetCompanyProfilesDetail?KodeEmiten=PWON&language=id-id on 14 November 2026, checked against https://lembarsaham.com/fundamental-saham/emiten/PWON. The sector names agree with https://www.idx.co.id/id/produk/indeks and https://www.idx.id/en/products/index/.",
  },
  SMGR: {
    name: "Semen Indonesia (Persero) Tbk",
    sector: "basicMaterials",
    source: readOn14November2026,
  },
  TLKM: {
    name: "Telkom Indonesia (Persero) Tbk",
    sector: "infrastructures",
    source: readOn14November2026,
  },
  UNTR: {
    name: "United Tractors Tbk",
    sector: "industrials",
    source: readOn14November2026,
  },
  UNVR: {
    name: "Unilever Indonesia Tbk",
    sector: "consumerNonCyclicals",
    source: readOn14November2026,
  },
  WIFI: {
    name: "Solusi Sinergi Digital Tbk",
    sector: "technology",
    source: readOn14November2026,
  },
};

const companyByCode: ReadonlyMap<string, Company> = new Map(
  Object.entries(companies),
);

/** The company behind a stock that Portolab tracks, by the code of the stock. Every stock that Portolab stores a price, a holding, or an order of is tracked, so only a broken database holds another code. */
export function companyOf(code: string): Company {
  const company = companyByCode.get(code);
  if (company === undefined) {
    throw new Error(
      `Portolab tracks no stock with the code ${code}, so no code of Portolab stored it, and the database is broken.`,
    );
  }
  return company;
}
