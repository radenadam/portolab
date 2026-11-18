import type { ReactNode } from "react";
import { NumberText } from "~/number-text";

export function emphasizedNumber(value: string): ReactNode {
  return (
    <strong>
      <NumberText whole>{value}</NumberText>
    </strong>
  );
}
