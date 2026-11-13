import type { Page } from "@playwright/test";

/** The token in app/theme.css that holds the largest width of the content of a screen, which decision 0028 sets. */
export const contentWidthToken = "--width-content";

/** A rule of the layout of decision 0028 that a program can measure. */
export type LayoutRule =
  "width" | "content" | "reading" | "columns" | "rows" | "tables" | "cells";

/** A rule that the screen of a page breaks, with the sentence that says where and by how much. */
export interface LayoutProblem {
  rule: LayoutRule;
  text: string;
}

/** Returns the problem of a page that scrolls sideways, which a page wider than a phone does under the reader's thumb, or none. */
export async function sidewaysProblems(page: Page): Promise<LayoutProblem[]> {
  const widths = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    screen: document.documentElement.clientWidth,
  }));
  return widths.page > widths.screen
    ? [
        {
          rule: "width",
          text: `The page is ${String(widths.page)} pixels wide, but the screen is ${String(widths.screen)} pixels wide, so it scrolls sideways.`,
        },
      ]
    : [];
}

/**
 * Returns each rule of the layout of decision 0028 that the screen of a page breaks, after its fonts load. Every rule leaves out a part that the screen hides, or places outside the flow with `position: absolute` or `fixed`, such as a popover.
 * - `width`: the page never scrolls sideways.
 * - `content`: an element marked `data-layout="content"` is never wider than the token of the width of content, and it stands in the middle of the content box of its parent.
 * - `reading`: an element marked `data-layout="reading"` stands in the middle of the content box of its parent.
 * - `columns`: the children of `data-layout="columns"` that sit side by side end on one line, within 2 pixels. A child ends where the last of its parts with a ground or a line under it ends, so a column that stretches while its cards stay short still ends early.
 * - `rows`: the children of `data-layout="rows"` are rows that share one column template. In each row the check follows the items of every grid and of every flex container that does not wrap, down to the fifth level. An item without text, such as a bar, starts and ends at the same place in every row, within 1 pixel, and an item with text starts or ends at the same place, so text can align left or right.
 * - `tables`: tables with the same heads of their columns put each column at the same place, within 1 pixel. Tables that stand one above the other compare their columns on the screen, and tables side by side compare them from their own left edge.
 * - `cells`: no cell of a table holds more than its column shows.
 */
export async function layoutProblems(page: Page): Promise<LayoutProblem[]> {
  // Until the fonts load, the browser draws text in a fallback font, whose widths differ.
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  return [
    ...(await sidewaysProblems(page)),
    ...(await page.evaluate(inspectLayout, contentWidthToken)),
  ];
}

// Playwright sends this function to the browser as its source, so it holds every helper that it calls.
function inspectLayout(widthToken: string): LayoutProblem[] {
  const problems: LayoutProblem[] = [];

  function nameOf(element: Element): string {
    const text = element.textContent.replaceAll(/\s+/g, " ").trim();
    return `<${element.tagName.toLowerCase()}> "${text.slice(0, 30)}"`;
  }
  function isShown(element: Element): boolean {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      !["absolute", "fixed"].includes(style.position) &&
      box.width > 0 &&
      box.height > 0
    );
  }
  function shownChildren(element: Element): Element[] {
    return Array.from(element.children).filter(isShown);
  }
  function spread(values: readonly number[]): number {
    return Math.max(...values) - Math.min(...values);
  }
  function marked(kind: string): Element[] {
    return Array.from(
      document.querySelectorAll(`[data-layout="${kind}"]`),
    ).filter(isShown);
  }
  function pixels(value: number): string {
    return String(Math.round(value));
  }
  // A rule that allows 1 pixel reports what it found to a tenth of a pixel, so a distance just past the rule never reads as 1 pixel.
  function tenthsOfPixels(value: number): string {
    return value.toFixed(1);
  }

  function checkMiddle(element: Element, what: string, rule: LayoutRule): void {
    const parent = element.parentElement;
    if (parent === null) {
      return;
    }
    const box = element.getBoundingClientRect();
    const parentBox = parent.getBoundingClientRect();
    const parentStyle = getComputedStyle(parent);
    const left =
      box.left - parentBox.left - parseFloat(parentStyle.paddingLeft);
    const right =
      parentBox.right - parseFloat(parentStyle.paddingRight) - box.right;
    if (Math.abs(left - right) > 2) {
      problems.push({
        rule,
        text: `The ${what} ${nameOf(element)} is not in the middle of its parent, because the space on its left and the space on its right differ by ${pixels(Math.abs(left - right))} pixels.`,
      });
    }
  }

  function tokenWidth(): number {
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.width = `var(${widthToken})`;
    document.body.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  }

  function checkContents(): void {
    const contents = marked("content");
    if (contents.length === 0) {
      return;
    }
    const largestWidth = tokenWidth();
    if (largestWidth === 0) {
      problems.push({
        rule: "content",
        text: `The page marks content with data-layout="content", but it defines no token ${widthToken} for the largest width of content.`,
      });
      return;
    }
    for (const content of contents) {
      const width = content.getBoundingClientRect().width;
      if (width > largestWidth + 0.5) {
        problems.push({
          rule: "content",
          text: `The content ${nameOf(content)} is ${pixels(width)} pixels wide, more than the ${pixels(largestWidth)} pixels of ${widthToken}.`,
        });
      }
      checkMiddle(content, "content", "content");
    }
  }

  function checkReading(): void {
    for (const reading of marked("reading")) {
      checkMiddle(reading, "reading column", "reading");
    }
  }

  function hasGround(element: Element): boolean {
    const style = getComputedStyle(element);
    const isClear = ["", "transparent", "rgba(0, 0, 0, 0)"].includes(
      style.backgroundColor,
    );
    const hasLineUnder =
      parseFloat(style.borderBottomWidth) > 0 &&
      style.borderBottomStyle !== "none";
    return !isClear || hasLineUnder;
  }
  function footOf(element: Element): number {
    const children = shownChildren(element);
    if (hasGround(element) || children.length === 0) {
      return element.getBoundingClientRect().bottom;
    }
    return Math.max(...children.map(footOf));
  }
  function linesOf(columns: Element): Element[][] {
    const lines: { top: number; items: Element[] }[] = [];
    for (const child of shownChildren(columns)) {
      const top = child.getBoundingClientRect().top;
      const line = lines.find(
        (candidate) => Math.abs(candidate.top - top) <= 2,
      );
      if (line === undefined) {
        lines.push({ top, items: [child] });
      } else {
        line.items.push(child);
      }
    }
    return lines.map((line) => line.items);
  }
  function checkColumns(): void {
    for (const columns of marked("columns")) {
      for (const items of linesOf(columns).filter((line) => line.length > 1)) {
        const feet = items.map(footOf);
        if (spread(feet) > 2) {
          problems.push({
            rule: "columns",
            text: `The columns ${items.map(nameOf).join(" and ")} of ${nameOf(columns)} end ${pixels(spread(feet))} pixels apart.`,
          });
        }
      }
    }
  }

  function isContainer(element: Element): boolean {
    return /^(inline-)?(grid|flex)$/.test(getComputedStyle(element).display);
  }
  function hasNoText(element: Element): boolean {
    return (
      element.tagName.toLowerCase() === "svg" ||
      element.textContent.trim() === ""
    );
  }
  // A flex container that holds one phrase, such as a change with its arrow, is one item, so the check does not look inside it. A grid always holds columns.
  function isPhrase(element: Element): boolean {
    if (getComputedStyle(element).display.includes("grid")) {
      return false;
    }
    const hasOwnWords = Array.from(element.childNodes).some(
      (node) =>
        node.nodeType === Node.TEXT_NODE &&
        (node.textContent ?? "").trim() !== "",
    );
    const children = Array.from(element.children);
    const holdsOnePhrase =
      !children.some(isContainer) &&
      children.filter((child) => !hasNoText(child)).length <= 1;
    return hasOwnWords || holdsOnePhrase;
  }
  // The items of a flex container that wraps flow like words, so they are not compared, but their own columns are.
  function wraps(element: Element): boolean {
    const style = getComputedStyle(element);
    return style.display.includes("flex") && style.flexWrap !== "nowrap";
  }
  // Below the fifth level of a row lie the parts of one item, such as the arrow and the number of a change, so the check compares no deeper, as the check of the prototype did.
  const rowLevels = 5;
  interface RowItem {
    element: Element;
    lefts: number[];
    rights: number[];
  }
  function collectItems(
    row: Element,
    path: string,
    items: Map<string, RowItem>,
  ): void {
    for (const [index, item] of shownChildren(row).entries()) {
      const itemPath = `${path}/${String(index)}${item.tagName}`;
      if (!wraps(row)) {
        const box = item.getBoundingClientRect();
        const found = items.get(itemPath) ?? {
          element: item,
          lefts: [],
          rights: [],
        };
        found.lefts.push(box.left);
        found.rights.push(box.right);
        items.set(itemPath, found);
      }
      const isColumns =
        isContainer(item) && !hasNoText(item) && !isPhrase(item);
      // A path holds one part for each level of the row.
      const level = itemPath.split("/").length - 1;
      if (level < rowLevels && isColumns) {
        collectItems(item, itemPath, items);
      }
    }
  }
  function moves({ element, lefts, rights }: RowItem): boolean {
    const leftMoves = spread(lefts) > 1;
    const rightMoves = spread(rights) > 1;
    return hasNoText(element)
      ? leftMoves || rightMoves
      : leftMoves && rightMoves;
  }
  function checkRows(): void {
    for (const list of marked("rows")) {
      const items = new Map<string, RowItem>();
      for (const row of shownChildren(list)) {
        collectItems(row, "", items);
      }
      const moved = Array.from(items.values()).find(
        (item) => item.lefts.length > 1 && moves(item),
      );
      if (moved !== undefined) {
        const distance = Math.max(spread(moved.lefts), spread(moved.rights));
        problems.push({
          rule: "rows",
          text: `The rows of ${nameOf(list)} do not share one column template, because the item ${nameOf(moved.element)} moves ${tenthsOfPixels(distance)} pixels from row to row.`,
        });
      }
    }
  }

  function headsOf(table: Element): Element[] {
    return Array.from(table.querySelectorAll("thead th"));
  }
  function headText(head: Element): string {
    return head.textContent.replaceAll(/\s+/g, " ").trim();
  }
  function checkTablePair(first: Element, second: Element): void {
    const firstHeads = headsOf(first);
    const secondHeads = headsOf(second);
    const names = firstHeads.map(headText).join(", ");
    if (
      firstHeads.length === 0 ||
      names !== secondHeads.map(headText).join(", ")
    ) {
      return;
    }
    const firstBox = first.getBoundingClientRect();
    const secondBox = second.getBoundingClientRect();
    const isStacked =
      firstBox.left < secondBox.right && secondBox.left < firstBox.right;
    const firstStart = isStacked ? 0 : firstBox.left;
    const secondStart = isStacked ? 0 : secondBox.left;
    for (const [column, head] of firstHeads.entries()) {
      const otherHead = secondHeads[column] ?? head;
      const distance = Math.abs(
        head.getBoundingClientRect().left -
          firstStart -
          (otherHead.getBoundingClientRect().left - secondStart),
      );
      if (distance > 1) {
        problems.push({
          rule: "tables",
          text: `Two tables with the columns ${names} start the column "${headText(head)}" ${tenthsOfPixels(distance)} pixels apart.`,
        });
        return;
      }
    }
  }
  function checkTables(): void {
    const tables = Array.from(document.querySelectorAll("table")).filter(
      isShown,
    );
    for (const [index, first] of tables.entries()) {
      for (const second of tables.slice(index + 1)) {
        checkTablePair(first, second);
      }
    }
  }

  function checkCells(): void {
    for (const cell of document.querySelectorAll("td, th")) {
      if (isShown(cell) && cell.scrollWidth > cell.clientWidth + 1) {
        problems.push({
          rule: "cells",
          text: `The cell ${nameOf(cell)} holds more than its column shows.`,
        });
      }
    }
  }

  checkContents();
  checkReading();
  checkColumns();
  checkRows();
  checkTables();
  checkCells();
  return problems;
}
