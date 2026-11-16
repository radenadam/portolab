import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { GuideContent, GuidePart } from "./guide-content";
import styles from "./guide.module.css";

export function GuideView({ guide }: { guide: GuideContent }): ReactNode {
  return (
    <article className={styles["reading"]} data-layout="reading">
      <h1>{guide.title}</h1>
      <details className={styles["contents"]}>
        <summary>{m.learning_guide_contents_label()}</summary>
        <nav aria-label={m.learning_guide_contents_label()}>
          {guide.sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>
      </details>
      {guide.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={styles["section"]}
          aria-labelledby={`${section.id}-title`}
        >
          <h2 id={`${section.id}-title`}>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.map((part) => part.text).join("")}>
              <GuideParagraph parts={paragraph} />
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

function GuideParagraph({ parts }: { parts: readonly GuidePart[] }): ReactNode {
  const children: ReactNode[] = [];
  let text = "";
  for (const [index, part] of parts.entries()) {
    if (part.kind === "link") {
      children.push(
        <NumberText key={`text-${String(index)}`}>{text}</NumberText>,
      );
      text = "";
      children.push(
        <a key={index} href={part.href} className={styles["link"]}>
          {part.text}
        </a>,
      );
    } else text += part.kind === "label" ? `"${part.text}"` : part.text;
  }
  children.push(<NumberText key="tail">{text}</NumberText>);
  return children;
}
