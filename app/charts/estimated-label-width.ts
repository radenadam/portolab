// Server drawings precede the browser's font measurements. Rounded upper bounds of the bundled font's regular and semibold glyphs leave room for its widest letters, and fallback glyphs get extra room because their font can differ.
const measuredCharacterWidths = new Map<string, number>([
  ["A", 0.74],
  ["B", 0.65],
  ["C", 0.75],
  ["D", 0.76],
  ["E", 0.64],
  ["F", 0.61],
  ["G", 0.77],
  ["H", 0.74],
  ["I", 0.26],
  ["J", 0.46],
  ["K", 0.72],
  ["L", 0.59],
  ["M", 0.91],
  ["N", 0.74],
  ["O", 0.8],
  ["P", 0.67],
  ["Q", 0.81],
  ["R", 0.67],
  ["S", 0.64],
  ["T", 0.67],
  ["U", 0.72],
  ["V", 0.74],
  ["W", 1.09],
  ["X", 0.71],
  ["Y", 0.7],
  ["Z", 0.64],
  ["a", 0.56],
  ["b", 0.63],
  ["c", 0.56],
  ["d", 0.63],
  ["e", 0.58],
  ["f", 0.37],
  ["g", 0.63],
  ["h", 0.62],
  ["i", 0.26],
  ["j", 0.26],
  ["k", 0.56],
  ["l", 0.26],
  ["m", 0.95],
  ["n", 0.62],
  ["o", 0.6],
  ["p", 0.63],
  ["q", 0.63],
  ["r", 0.39],
  ["s", 0.5],
  ["t", 0.41],
  ["u", 0.61],
  ["v", 0.54],
  ["w", 0.8],
  ["x", 0.59],
  ["y", 0.54],
  ["z", 0.52],
  [" ", 0.2],
  ["\u00a0", 0.2],
  ["+", 0.55],
  ["-", 0.51],
  [".", 0.28],
  [",", 0.28],
  ["%", 0.79],
  ["&", 0.77],
  ["@", 0.87],
  ["_", 0.47],
  ["…", 1],
]);

// A label and its axis can use different fonts and sizes, so callers scale this width in the label's own text size.
export function estimatedLabelWidth(text: string): number {
  let width = 0;
  for (const character of text) {
    width += characterWidth(character);
  }
  return width;
}

function characterWidth(character: string): number {
  const special = measuredCharacterWidths.get(character);
  if (special !== undefined) return special;
  if (/[0-9]/u.test(character)) return 0.7;
  if (/[!-~]/u.test(character)) return 0.9;
  return 2;
}
