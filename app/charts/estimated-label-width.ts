/** The width of a text in Instrument Sans in semibold, the font of the labels, in sizes of the text, as the server estimates it before a browser measures the text. A browser measured the letters of the font: a capital is 0.69 of the size of the text wide on average, a small letter 0.54, a figure 0.6, and a space 0.19, and the estimate rounds each up a little, so it leaves a label more room rather than less. Any other character, such as a sign, counts as wide as a figure, which is at least as wide as the signs of a value, such as + and %. */
export function estimatedLabelWidth(text: string): number {
  let width = 0;
  for (const character of text) {
    width += characterWidth(character);
  }
  return width;
}

function characterWidth(character: string): number {
  if (character === " ") {
    return 0.2;
  }
  if (/\p{Lu}/u.test(character)) {
    return 0.7;
  }
  if (/\p{Ll}/u.test(character)) {
    return 0.55;
  }
  return 0.6;
}
