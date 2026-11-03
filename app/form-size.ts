import { bytes } from "./units/bytes.ts";

/** The most bytes of the body of a request. The largest form of Portolab fits in it, as a browser test shows, so a larger body comes only from a text pasted into a field by mistake or from a forged request. */
export const formMaximumBytes = bytes(128_000);

/** The most bytes of a form larger than formMaximumBytes that the server reads and throws away before it answers, so that the browser of a person who pasted a long text into a field finishes sending and shows the answer. Ten million bytes hold more than the text of a long book, and a larger body comes only from a forged request, which the server stops reading. */
export const discardMaximumBytes = bytes(10_000_000);

/** The most digits of the size that a request states for its body. A whole number of this many digits stays below the largest one that JavaScript holds exactly, and no browser states a size with more digits, so only a forged request sends one. */
export const statedSizeMaximumDigits = 15;

/** The most characters of any field of a form or of an address, as sent. RFC 9110 recommends that HTTP supports addresses of at least 8,000 octets, and an address, such as a path to return to, is the longest text that a field of Portolab takes. The rule of every field allows far less, and its error explains any shorter text, so only a forged request or a text pasted by mistake reaches this maximum. */
export const fieldMaximumLength = 8000;
