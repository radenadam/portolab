import { data } from "react-router";
import type { MiddlewareFunction } from "react-router";
import { discardMaximumBytes, formMaximumBytes } from "./form-size";
import { fail, succeed } from "./result";
import type { Result } from "./result";
import { tooLargeFormStatus } from "./too-large-form";
import { isBytes } from "./units/bytes";
import type { Bytes } from "./units/bytes";
import { describeValue } from "./value-shapes";
import { writeLog } from "./write-log.server";

/** Refuses a request whose body is larger than formMaximumBytes before any action reads the body, so a visitor cannot make the server read, keep, and parse a body of any size. A browser states the size of every form, so the refusal of its form names that size. */
export const formSizeLimit: MiddlewareFunction<Response> = async (
  { request },
  next,
) => {
  const header = request.headers.get("Content-Length");
  if (header === null) {
    if (!(await bodyFitsWithinLimit(request))) {
      refuseForm(request, undefined);
    }
    return next();
  }
  const statedSize = parseContentLength(header, "The header Content-Length");
  if (!statedSize.ok) {
    // Node lets only digits through in this header, so it fails to parse only when it has more digits than JavaScript holds exactly, which states a body far past the limit.
    writeLog("warning", statedSize.failure, { url: request.url });
    refuseForm(request, undefined);
  }
  if (statedSize.value > formMaximumBytes) {
    // A browser reads the answer only after it has sent the whole form, and Node resets a connection whose body stays unread, so the rest of a form that a person may have pasted is read and thrown away first.
    if (statedSize.value <= discardMaximumBytes) {
      await discardBody(request);
    }
    refuseForm(request, statedSize.value);
  }
  return next();
};

function parseContentLength(
  value: unknown,
  source: string,
): Result<Bytes, string> {
  // Fifteen digits stay below the largest whole number that JavaScript holds exactly.
  const size =
    typeof value === "string" && /^\d{1,15}$/.test(value)
      ? Number(value)
      : undefined;
  return isBytes(size)
    ? succeed(size)
    : fail(
        `${source} must be a whole number of bytes with at most 15 digits, but it is ${describeValue(value)}.`,
      );
}

/** Whether the body of a request that does not state its size has at most formMaximumBytes. Node ends every other body at the size that its request states. It reads a copy of the body, so an action can still read the body afterwards, and it stops at the first piece of the body past the limit, so a larger body costs at most the limit and one piece. A request without a body fits. */
async function bodyFitsWithinLimit(request: Request): Promise<boolean> {
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
    if (size > formMaximumBytes) {
      return false;
    }
  }
}

/** Reads the body of a request to its end and keeps none of it. */
async function discardBody(request: Request): Promise<void> {
  if (request.body === null) {
    return;
  }
  const reader = request.body.getReader();
  for (;;) {
    const piece = await reader.read();
    if (piece.done) {
      return;
    }
  }
}

/** Answers with the page of a form that is too large, which names the size that the request stated, and writes the refusal to the log. */
function refuseForm(request: Request, statedSize: Bytes | undefined): never {
  writeLog("warning", "Refused a form larger than its limit.", {
    url: request.url,
    statedBytes: statedSize ?? null,
    maximumBytes: formMaximumBytes,
  });
  throw data(statedSize ?? null, { status: tooLargeFormStatus });
}
