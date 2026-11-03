import { data } from "react-router";
import type { MiddlewareFunction } from "react-router";
import { formMaximumBytes, tooLargeFormStatus } from "./form-size";
import type { Bytes } from "./units/bytes";
import { writeLog } from "./write-log.server";

/** Refuses a request whose body is larger than formMaximumBytes before any action reads the body, so a visitor cannot make the server read, keep, and parse a body of any size. */
export const formSizeLimit: MiddlewareFunction<Response> = async (
  { request },
  next,
) => {
  if (!(await bodyFitsWithin(request, formMaximumBytes))) {
    writeLog("warning", "Refused a form larger than its limit.", {
      url: request.url,
      maximumBytes: formMaximumBytes,
    });
    throw data(null, { status: tooLargeFormStatus });
  }
  return next();
};

/**
 * Whether the body of a request has at most the maximum number of bytes. It reads a copy of the body, so an action can still read the body afterwards, and it stops at the first piece of the body past the maximum, so a larger body costs no more than one of the maximum size. A request without a body fits.
 * @internal Tests call it directly, because formSizeLimit reaches it only through a request to the server, and only with the limit of a form.
 */
export async function bodyFitsWithin(
  request: Request,
  maximum: Bytes,
): Promise<boolean> {
  // A body without the header Content-Length arrives in pieces of unknown number, so the size is counted instead of read from the header.
  const body = request.clone().body;
  if (body === null) {
    return true;
  }
  const reader = body.getReader();
  let size = 0;
  for (;;) {
    const piece = await reader.read();
    if (piece.done) {
      return true;
    }
    size += piece.value.byteLength;
    // The copy stays unread instead of cancelled, because a copy cancels only together with the body of the request, which no action reads after a refusal.
    if (size > maximum) {
      return false;
    }
  }
}
