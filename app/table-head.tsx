import type { ReactNode } from "react";
import { NumberText } from "~/number-text";

export function TableHead({
  labels,
  help,
}: {
  labels: readonly string[];
  help?: Readonly<Record<string, ReactNode>>;
}): ReactNode {
  return (
    <thead>
      <tr>
        {labels.map((label) => (
          <th key={label} scope="col">
            <NumberText>{label}</NumberText>
            {help?.[label]}
          </th>
        ))}
      </tr>
    </thead>
  );
}
