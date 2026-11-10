/** The value of the header Content-Disposition that makes a browser save a response as a file of a name, which can hold any character, as RFC 6266 and RFC 8187 define it. */
export function attachmentHeader(fileName: string): string {
  // RFC 8187 allows in a value only letters, digits, and !#$&+-.^_`|~, so every other byte of the name in UTF-8 is a percent escape. encodeURIComponent leaves '()* as they are, which the RFC does not allow.
  const value = encodeURIComponent(fileName).replaceAll(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename*=UTF-8''${value}`;
}
