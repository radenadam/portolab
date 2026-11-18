interface CharacterSet {
  ranges: readonly (readonly [string, string])[];
  symbols: readonly string[];
}

export function includesCharacter(
  characters: CharacterSet,
  character: string,
): boolean {
  for (const [first, last] of characters.ranges) {
    if (character >= first && character <= last) return true;
  }
  return characters.symbols.includes(character);
}

export function describeCharacters(
  characters: CharacterSet,
  range: (first: string, last: string) => string,
): string[] {
  return [
    ...characters.ranges.map(([first, last]) => range(first, last)),
    ...characters.symbols.map((symbol) => `"${symbol}"`),
  ];
}
