import { paddedRange } from "./scale";
import type { Range } from "./scale";

// The corner labels need a band above and below the class points, also on a phone.
const cornerPadding = 0.2;

export function mapRange<Value extends number>(
  values: readonly Value[],
  toValue: (value: number) => Value,
  settings: {
    include?: readonly Value[] | undefined;
    roomForCorners?: boolean | undefined;
  },
): Range<Value> {
  const covered = [...values, ...(settings.include ?? [])];
  return paddedRange(covered, toValue, {
    paddingShare: settings.roomForCorners === true ? cornerPadding : undefined,
    minimum:
      settings.roomForCorners !== true && Math.min(...covered) >= 0
        ? toValue(0)
        : undefined,
  });
}
