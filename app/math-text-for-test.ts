interface MathNode {
  name: string;
  children: (MathNode | string)[];
}

const mathPattern = /<math\b[^>]*>([\s\S]*?)<\/math>/gu;
const partPattern = /<(\/?)([a-z]+)\b[^>]*>|([^<]+)/gu;
// These operators stand between two terms, so the text gives them a space on each side, as the notation does.
const spacedOperators = new Set(["=", "≈", "+", "−", "×"]);

/** Markup with each formula of MathML written as a line of text in the notation of LaTeX, such as \frac{σ_{iM}}{σ_M^2}, with the lines of an aligned formula apart by \\, so a test reads a formula whole. app/math-notation.test.tsx checks the MathML itself. */
export function mathTextForTest(markup: string): string {
  return markup.replaceAll(mathPattern, (_math, content: string) =>
    textOf(mathTreeOf(content)),
  );
}

function mathTreeOf(content: string): MathNode {
  const root: MathNode = { name: "math", children: [] };
  const open: MathNode[] = [root];
  for (const part of content.matchAll(partPattern)) {
    const parent = open.at(-1);
    if (parent === undefined)
      throw new Error(
        `The MathML ${content} closes more elements than it opens.`,
      );
    const [, closing, name, text] = part;
    if (text !== undefined) parent.children.push(text);
    else if (closing === "/") open.pop();
    else {
      const node: MathNode = { name: name ?? "", children: [] };
      parent.children.push(node);
      open.push(node);
    }
  }
  return root;
}

// Each element that is not a row writes its parts in the notation of LaTeX, and a row, such as mrow or a cell, joins them.
const writers: Record<string, (parts: readonly string[]) => string> = {
  mo: ([operator = ""]) => {
    if (operator === ",") return ", ";
    return spacedOperators.has(operator) ? ` ${operator} ` : operator;
  },
  msub: ([base = "", subscript = ""]) => `${base}_${grouped(subscript)}`,
  munder: ([base = "", under = ""]) => `${base}_${grouped(under)}`,
  msup: ([base = "", superscript = ""]) => `${base}^${grouped(superscript)}`,
  msubsup: ([base = "", subscript = "", superscript = ""]) =>
    `${base}_${grouped(subscript)}^${grouped(superscript)}`,
  mover: ([base = "", over = ""]) => `\\overset{${over}}{${base}}`,
  mfrac: ([numerator = "", denominator = ""]) =>
    `\\frac{${numerator.trim()}}{${denominator.trim()}}`,
  msqrt: (parts) => `\\sqrt{${parts.join("").trim()}}`,
  mtable: (rows) => rows.join(" \\\\ "),
  mtr: (cells) =>
    cells
      .map((cell) => cell.trim())
      .filter((cell) => cell !== "")
      .join(" "),
};

function textOf(node: MathNode | string): string {
  if (typeof node === "string") return node;
  const parts = node.children.map(textOf);
  const writer = writers[node.name];
  return writer === undefined ? parts.join("") : writer(parts);
}

function grouped(text: string): string {
  return Array.from(text).length === 1 ? text : `{${text}}`;
}

/** The markup of a formula as a test reads it: its notation, as mathTextForTest writes it, and the spreadsheet function after it. */
export function formulaMarkupForTest(
  notation: string,
  spreadsheetFunction?: string,
): string {
  return `<span>${notation}${spreadsheetFunction === undefined ? "" : ` <small>(${spreadsheetFunction})</small>`}</span>`;
}
