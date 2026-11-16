import { useIsInBrowser } from "~/use-is-in-browser";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import styles from "./lesson-practice.module.css";

// Controls wait for hydration because a slider on the server-rendered page would not update its calculation.
export function LessonSlider({
  id,
  kind,
  label,
  text,
  value,
  minimum = 0,
  maximum,
  step,
  onChange,
}: {
  id: string;
  kind: "beta" | "weight";
  label: string;
  text: string;
  value: number;
  minimum?: number;
  maximum: number;
  step: number | "any";
  onChange: (value: number) => void;
}): ReactNode {
  const interactive = useIsInBrowser();
  return (
    <div className={styles["slider"]} data-kind={kind}>
      {interactive ? <label htmlFor={id}>{label}</label> : <span>{label}</span>}
      <output htmlFor={interactive ? id : undefined}>
        <NumberText whole>{text}</NumberText>
      </output>
      {interactive && (
        <input
          id={id}
          type="range"
          min={minimum}
          max={maximum}
          step={step}
          value={value}
          onChange={(event) => {
            onChange(event.currentTarget.valueAsNumber);
          }}
        />
      )}
    </div>
  );
}
