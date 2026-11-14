import { expect, test } from "vitest";
import { parseHomeMapView } from "./parse-home-map-view";

test("chooses the time chart only for its named view and otherwise keeps the default map", () => {
  expect(parseHomeMapView("time", "view")).toEqual({ ok: true, value: "time" });
  for (const value of [null, "map"])
    expect(parseHomeMapView(value, "view")).toEqual({ ok: true, value: "map" });
});
test("rejects an unknown home map view", () => {
  expect(parseHomeMapView("unknown", "view")).toEqual({
    ok: false,
    failure: 'view must be "map" or "time", but it is "unknown".',
  });
});
