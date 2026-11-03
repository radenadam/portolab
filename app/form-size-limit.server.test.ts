import { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import { captureStderrForTest } from "./capture-stderr-for-test";
import { discardMaximumBytes, formMaximumBytes } from "./form-size";
import { formSizeLimit } from "./form-size-limit.server";

const formAddress = new URL("http://localhost:3000/sign-in");

/** A body that sends pieces of six bytes without end, as a forged request can. */
function endlessBody(): ReadableStream<Uint8Array> {
  const piece = new TextEncoder().encode("aaaaaa");
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(piece);
    },
  });
}

/** A form that the browser sends with a stated size, as every browser does, or a body that streams without one. */
function formRequest(
  body: string | ReadableStream<Uint8Array>,
  statedSize?: number,
): Request {
  // Node needs the option duplex for a body that streams, which the type of the options of a request lacks.
  const options: RequestInit & { duplex: "half" } = {
    method: "POST",
    body,
    duplex: "half",
    headers:
      statedSize === undefined ? {} : { "Content-Length": String(statedSize) },
  };
  return new Request(formAddress, options);
}

/** Runs the limit on a request as the root route does, and returns what the next step answered. */
function runLimit(request: Request): Promise<unknown> {
  return Promise.resolve(
    formSizeLimit(
      {
        request,
        url: formAddress,
        params: {},
        pattern: "/sign-in",
        context: new RouterContextProvider(),
      },
      () => Promise.resolve(new Response("the action ran")),
    ),
  );
}

test("lets a form of the largest size through, and leaves its whole body for the action", async () => {
  const body = "a".repeat(formMaximumBytes);
  for (const request of [
    formRequest(body, formMaximumBytes),
    formRequest(body),
  ]) {
    expect(await runLimit(request)).toBeInstanceOf(Response);
    expect(await request.text()).toBe(body);
  }
});

test("lets a request without a body through", async () => {
  expect(await runLimit(new Request(formAddress))).toBeInstanceOf(Response);
});

test("refuses a form that states a size larger than the limit, names the size, and reads the rest of it first", async () => {
  const warnings = captureStderrForTest();
  const size = formMaximumBytes + 1;
  const request = formRequest("a".repeat(size), size);
  await expect(runLimit(request)).rejects.toMatchObject({
    data: size,
    init: { status: 413 },
  });
  expect(request.bodyUsed).toBe(true);
  expect(warnings).toHaveLength(1);
  expect(JSON.parse(warnings[0] ?? "")).toMatchObject({
    level: "warning",
    message: "Refused a form larger than its limit.",
    statedBytes: size,
    maximumBytes: formMaximumBytes,
  });
});

test("refuses a body that states a size larger than it reads and throws away, without reading it", async () => {
  captureStderrForTest();
  const request = formRequest(endlessBody(), discardMaximumBytes + 1);
  await expect(runLimit(request)).rejects.toMatchObject({
    data: discardMaximumBytes + 1,
    init: { status: 413 },
  });
  expect(request.bodyUsed).toBe(false);
});

test("refuses a body without a stated size at the first piece past the limit, so a body without end costs no more", async () => {
  captureStderrForTest();
  await expect(runLimit(formRequest(endlessBody()))).rejects.toMatchObject({
    data: null,
    init: { status: 413 },
  });
});

test("refuses a body that states more digits than JavaScript holds exactly, without reading it, and logs why", async () => {
  const warnings = captureStderrForTest();
  const statedSize = "1234567890123456789";
  const options: RequestInit & { duplex: "half" } = {
    method: "POST",
    body: endlessBody(),
    duplex: "half",
    headers: { "Content-Length": statedSize },
  };
  const request = new Request(formAddress, options);
  await expect(runLimit(request)).rejects.toMatchObject({
    data: null,
    init: { status: 413 },
  });
  expect(request.bodyUsed).toBe(false);
  expect(JSON.parse(warnings[0] ?? "")).toMatchObject({
    level: "warning",
    message: `The header Content-Length must be a whole number of bytes with at most 15 digits, but it is "${statedSize}".`,
  });
});
