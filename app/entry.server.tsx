import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { isRouteErrorResponse, ServerRouter } from "react-router";
import type { EntryContext, HandleErrorFunction } from "react-router";
import { errorDetail } from "./error-message";
import { secondMilliseconds } from "./time-units";
import { writeLog } from "./write-log.server";

export const streamTimeout = 5 * secondMilliseconds;

// eslint-disable-next-line max-params -- React Router calls handleRequest with these four arguments.
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
): Promise<Response> | Response {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  // Crawlers receive the whole page at once, while browsers receive the shell first and the rest as it streams.
  const waitsForAllContent = isbot(request.headers.get("user-agent") ?? "");

  return new Promise((resolve, reject) => {
    let statusCode = responseStatusCode;
    let isShellRendered = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const onReady = (): void => {
      isShellRendered = true;
      const body = new PassThrough({
        final(callback) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
          callback();
        },
      });
      responseHeaders.set("Content-Type", "text/html");
      pipe(body);
      resolve(
        new Response(createReadableStreamFromReadable(body), {
          headers: responseHeaders,
          status: statusCode,
        }),
      );
    };

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        ...(waitsForAllContent
          ? { onAllReady: onReady }
          : { onShellReady: onReady }),
        onShellError(error: unknown) {
          reject(error instanceof Error ? error : new Error(String(error)));
        },
        onError(error: unknown) {
          statusCode = 500;
          // Errors before the shell renders reject the promise, and React Router logs them through handleError.
          if (isShellRendered) {
            logError("Rendering a page failed.", request, error);
          }
        },
      },
    );

    // The extra second lets rejected boundaries flush before the stream aborts.
    timeoutId = setTimeout(() => {
      abort();
    }, streamTimeout + secondMilliseconds);
  });
}

export const handleError: HandleErrorFunction = (error, { request }) => {
  // A closed connection aborts its request, and an unknown address is the visitor's mistake, so neither is a server error.
  const isMissingPage = isRouteErrorResponse(error) && error.status === 404;
  if (!request.signal.aborted && !isMissingPage) {
    logError("A request failed.", request, error);
  }
};

function logError(message: string, request: Request, error: unknown): void {
  writeLog("error", message, {
    url: request.url,
    detail: errorDetail(error),
  });
}
