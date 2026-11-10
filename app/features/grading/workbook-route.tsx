import type { ReactNode } from "react";
import { attachmentHeader } from "~/attachment-header";
import { databaseContext } from "~/database/database.server";
import { RouteErrorPage } from "~/error-page";
import { requireTaughtClass } from "~/features/classes/taught-class.server";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";
import { m } from "~/paraglide/messages.js";
import {
  workbookMediaType,
  writeWorkbook,
} from "~/workbook/write-workbook.server";
import type { Route } from "./+types/workbook-route";
import { portfoliosWorksheet } from "./portfolios-worksheet";
import { readClassPortfolios } from "./read-class-portfolios.server";

// React Router answers a route without a page or an error boundary as a resource, with its failures as bare data. A person opens this address, so the route has the error boundary of the app, which shows a refusal as the page for an address that does not exist, and the middleware answers with the workbook before any page renders.
export const middleware: Route.MiddlewareFunction[] = [
  ({ context, request, params, url }) => {
    const taughtClass = requireTaughtClass(context, url, params.classId);
    const now = new Date();
    const source = readPriceSourceDescription(context);
    const workbook = writeWorkbook(
      portfoliosWorksheet({
        className: taughtClass.name,
        portfolios: readClassPortfolios(
          context.get(databaseContext),
          taughtClass,
          { request, now, delayMinutes: source.delayMinutes },
        ),
        now,
        source,
      }),
    );
    const fileName = `${m.grading_page_title({ class: taughtClass.name })}.xlsx`;
    return new Response(workbook, {
      headers: {
        "Content-Type": workbookMediaType,
        "Content-Disposition": attachmentHeader(fileName),
      },
    });
  },
];

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): ReactNode {
  return <RouteErrorPage error={error} />;
}
