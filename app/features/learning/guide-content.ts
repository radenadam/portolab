import type { Locale } from "../../paraglide/runtime.js";
import type { guideSectionIds } from "./guide-section-ids.ts";

export type GuidePart =
  | { kind: "text"; text: string }
  | { kind: "label" | "value"; reference: string; text: string }
  | { kind: "link"; reference: string; text: string; href: string };

export interface GuideContent {
  locale: Locale;
  title: string;
  sections: {
    id: (typeof guideSectionIds)[number];
    title: string;
    paragraphs: GuidePart[][];
  }[];
}
