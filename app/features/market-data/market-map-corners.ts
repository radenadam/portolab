import { m } from "~/paraglide/messages.js";
import type { MapCornersText } from "~/charts/map-corners";

export function marketMapCorners(): MapCornersText {
  return [
    {
      text: m.market_data_map_calm_gain_label(),
      wideText: m.market_data_map_calm_gain_wide_label(),
    },
    {
      text: m.market_data_map_wild_gain_label(),
      wideText: m.market_data_map_wild_gain_wide_label(),
    },
    {
      text: m.market_data_map_calm_loss_label(),
      wideText: m.market_data_map_calm_loss_wide_label(),
    },
    {
      text: m.market_data_map_wild_loss_label(),
      wideText: m.market_data_map_wild_loss_wide_label(),
    },
  ];
}
