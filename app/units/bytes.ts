/** A size of data, such as the body of a request, in bytes. A size is not a number of characters, because a character of text takes from one to four bytes. */
export type Bytes = number & { readonly brand: "Bytes" };

function isBytes(value: number): value is Bytes {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Makes a size that the program itself holds, such as a limit, into bytes. */
export function bytes(size: number): Bytes {
  if (!isBytes(size)) {
    throw new Error(`${String(size)} is not a number of bytes.`);
  }
  return size;
}
