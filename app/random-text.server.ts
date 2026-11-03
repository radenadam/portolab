import { randomBytes } from "node:crypto";

// Each of the 32 characters carries five bits of one random byte. The alphabet leaves out l, o, 0, and 1, which a reader confuses with each other.
const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";

/** Makes random text that a person can read and type without confusing its characters, such as the code of a class or a temporary password. Each character carries five bits. */
export function randomReadableText(length: number): string {
  let text = "";
  for (const byte of randomBytes(length)) {
    // The top five bits of a byte pick each character of the alphabet equally often.
    text += alphabet.charAt(byte >> 3);
  }
  return text;
}

/** The lowercase letters and digits that randomReadableText leaves out, because a reader confuses them with others, so that a text which states the rule can name them. */
export function lookalikeCharacters(): string[] {
  const characters: string[] = [];
  for (const character of "abcdefghijklmnopqrstuvwxyz0123456789") {
    if (!alphabet.includes(character)) {
      characters.push(character);
    }
  }
  return characters;
}

/** Whether a text uses only the characters that randomReadableText writes. */
export function isReadableText(text: string): boolean {
  for (const character of text) {
    if (!alphabet.includes(character)) {
      return false;
    }
  }
  return true;
}
