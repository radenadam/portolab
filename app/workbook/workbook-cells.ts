/** How a spreadsheet shows a number, each in the format of its own language: a whole number with groups of digits, a percentage with two decimals, or a number with two decimals. */
export type NumberFormat = "wholeNumber" | "percent" | "twoDecimals";

/** A cell of a worksheet: a text, plain or as a heading, or a number with its format. A spreadsheet never reads a text cell as a formula, whatever it holds. */
export type WorkbookCell =
  | { kind: "text"; text: string; style: "plain" | "heading" }
  | { kind: "number"; value: number; format: NumberFormat };

export function textCell(text: string): WorkbookCell {
  return { kind: "text", text, style: "plain" };
}

/** A text that heads a worksheet or a column, which the spreadsheet shows in bold. */
export function headingCell(text: string): WorkbookCell {
  return { kind: "text", text, style: "heading" };
}

export function numberCell(value: number, format: NumberFormat): WorkbookCell {
  return { kind: "number", value, format };
}
