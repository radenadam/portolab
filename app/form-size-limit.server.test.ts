import { expect, test } from "vitest";
import { bodyFitsWithin } from "./form-size-limit.server";
import { bytes } from "./units/bytes";

const formAddress = "http://localhost:3000/account/setup";

/** A request whose body arrives in pieces of six bytes without end and without the header Content-Length, as a forged request can send it. */
function endlessRequest(): Request {
  const piece = new TextEncoder().encode("aaaaaa");
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(piece);
    },
  });
  // Node needs the option duplex for a body that streams, which the type of the options of a request lacks.
  const options: RequestInit & { duplex: "half" } = {
    method: "POST",
    body,
    duplex: "half",
  };
  return new Request(formAddress, options);
}

test("accepts a body of the maximum size and leaves all of it for the action", async () => {
  const request = new Request(formAddress, {
    method: "POST",
    body: "a".repeat(10),
  });
  expect(await bodyFitsWithin(request, bytes(10))).toBe(true);
  expect(await request.text()).toBe("a".repeat(10));
});

test("accepts a request without a body", async () => {
  expect(await bodyFitsWithin(new Request(formAddress), bytes(10))).toBe(true);
});

test("rejects a body one byte larger than the maximum", async () => {
  const request = new Request(formAddress, {
    method: "POST",
    body: "a".repeat(11),
  });
  expect(await bodyFitsWithin(request, bytes(10))).toBe(false);
});

test("rejects a body without a stated size at the first piece past the maximum, so a body without end costs no more", async () => {
  expect(await bodyFitsWithin(endlessRequest(), bytes(10))).toBe(false);
});
