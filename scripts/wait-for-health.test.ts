import { createServer } from "node:http";
import type { Server } from "node:http";
import { once } from "node:events";
import { expect, onTestFinished, test } from "vitest";
import { waitForHealth } from "./wait-for-health.ts";

/** Starts a server on a free port that answers every request with a status, and returns the address of its health check. */
async function serverAnswering(status: number): Promise<string> {
  const server: Server = createServer((_request, response) => {
    response.statusCode = status;
    response.end();
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  onTestFinished(() => {
    server.close();
  });
  const address = server.address();
  const port =
    typeof address === "object" && address !== null ? address.port : 0;
  return `http://127.0.0.1:${String(port)}/health`;
}

/** The address of a health check on a port where nothing listens. */
async function closedAddress(): Promise<string> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port =
    typeof address === "object" && address !== null ? address.port : 0;
  server.close();
  await once(server, "close");
  return `http://127.0.0.1:${String(port)}/health`;
}

const options = {
  timeoutSeconds: 1,
  requestTimeoutSeconds: 1,
  stopReason: (): undefined => undefined,
};

test("waits until the server answers its health check", async () => {
  expect(await waitForHealth(await serverAnswering(200), options)).toEqual({
    kind: "answered",
  });
});

test("stops waiting with the reason when the process of the server stops", async () => {
  expect(
    await waitForHealth(await closedAddress(), {
      ...options,
      stopReason: () => "code 1",
    }),
  ).toEqual({ kind: "stopped", reason: "code 1" });
});

test("stops waiting when the time runs out, and counts a failed answer as no answer", async () => {
  expect(await waitForHealth(await closedAddress(), options)).toEqual({
    kind: "timedOut",
  });
  expect(await waitForHealth(await serverAnswering(500), options)).toEqual({
    kind: "timedOut",
  });
});

test("asks once when the time is zero", async () => {
  const noTime = { ...options, timeoutSeconds: 0 };
  expect(await waitForHealth(await serverAnswering(200), noTime)).toEqual({
    kind: "answered",
  });
  expect(await waitForHealth(await closedAddress(), noTime)).toEqual({
    kind: "timedOut",
  });
});
