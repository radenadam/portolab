import { bytes } from "./units/bytes.ts";

/** The most bytes that the body of a request may have. The largest form of Portolab fits in it, as a test shows, so a larger body comes only from a text pasted into a field by mistake or from a forged request. */
export const formMaximumBytes = bytes(128_000);

/** The status of the answer to a body larger than formMaximumBytes. Only the limit of the body answers with it, so the error page can tell its refusal from other failures. */
export const tooLargeFormStatus = 413;
