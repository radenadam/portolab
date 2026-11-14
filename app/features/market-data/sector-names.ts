import { m } from "~/paraglide/messages.js";
import type { Sector } from "./company-of";

export const sectorNames: Record<Sector, () => string> = {
  energy: () => m.market_data_energy_sector_name(),
  basicMaterials: () => m.market_data_basic_materials_sector_name(),
  industrials: () => m.market_data_industrials_sector_name(),
  consumerNonCyclicals: () =>
    m.market_data_consumer_non_cyclicals_sector_name(),
  consumerCyclicals: () => m.market_data_consumer_cyclicals_sector_name(),
  healthcare: () => m.market_data_healthcare_sector_name(),
  financials: () => m.market_data_financials_sector_name(),
  propertiesAndRealEstate: () =>
    m.market_data_properties_and_real_estate_sector_name(),
  technology: () => m.market_data_technology_sector_name(),
  infrastructures: () => m.market_data_infrastructures_sector_name(),
};
