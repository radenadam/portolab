/** Makes Intl write one space wherever its data writes any space, as an engine with other data of Intl does, such as one that writes a narrow no-break space before AM or PM where Node writes a plain space. It returns a function that restores Intl. A browser test sends the source of this function to the browser, so the function refers to nothing outside its body. */
export function writeIntlSpacesForTest(space: string): () => void {
  const spaces = /\p{Zs}/gu;
  const restores: (() => void)[] = [];
  for (const prototype of [
    Intl.NumberFormat.prototype,
    Intl.DateTimeFormat.prototype,
    Intl.ListFormat.prototype,
  ]) {
    const originalParts = Object.getOwnPropertyDescriptor(
      prototype,
      "formatToParts",
    );
    const originalFormat = Object.getOwnPropertyDescriptor(prototype, "format");
    if (originalParts === undefined || originalFormat === undefined)
      throw new Error("A format of Intl has no format or formatToParts.");
    const formatToParts: unknown = originalParts.value;
    if (typeof formatToParts !== "function")
      throw new Error("A format of Intl has no method formatToParts.");
    const respacedParts = function (
      this: unknown,
      value: unknown,
    ): { type: string; value: string }[] {
      const parts = Reflect.apply(formatToParts, this, [value]) as {
        type: string;
        value: string;
      }[];
      const respaced: { type: string; value: string }[] = [];
      for (const part of parts) {
        // The words of a list are the caller's, not the data of Intl.
        respaced.push(
          part.type === "element"
            ? part
            : { ...part, value: part.value.replaceAll(spaces, space) },
        );
      }
      return respaced;
    };
    // A format of Intl writes the parts that formatToParts gives, one after another.
    const joined = function (this: unknown, value: unknown): string {
      let text = "";
      for (const part of respacedParts.call(this, value)) text += part.value;
      return text;
    };
    Object.defineProperty(prototype, "formatToParts", {
      ...originalParts,
      value: respacedParts,
    });
    // NumberFormat and DateTimeFormat give format through a getter that returns a bound function, and ListFormat gives it as a method.
    Object.defineProperty(
      prototype,
      "format",
      "get" in originalFormat
        ? {
            ...originalFormat,
            get(this: unknown) {
              return (value: unknown) => joined.call(this, value);
            },
          }
        : { ...originalFormat, value: joined },
    );
    restores.push(() => {
      Object.defineProperty(prototype, "formatToParts", originalParts);
      Object.defineProperty(prototype, "format", originalFormat);
    });
  }
  return () => {
    for (const restore of restores) restore();
  };
}
