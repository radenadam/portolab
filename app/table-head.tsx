import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import hiddenStyles from "./visually-hidden.module.css";

export function TableHead({
  labels,
  help,
  hiddenLabels,
}: {
  labels: readonly string[];
  help?: Readonly<Record<string, ReactNode>>;
  hiddenLabels?: readonly string[];
}): ReactNode {
  return (
    <thead>
      <tr>
        {labels.map((label) => {
          const hidden = hiddenLabels?.includes(label) ?? false;
          return (
            <th key={label} scope="col">
              {hidden ? (
                <span className={hiddenStyles["text"]}>{label}</span>
              ) : (
                <NumberText>{label}</NumberText>
              )}
              {help?.[label]}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
