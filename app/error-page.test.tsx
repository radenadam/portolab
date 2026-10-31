import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { afterEach, expect, test } from "vitest";
import { getLocale, overwriteGetLocale } from "./paraglide/runtime.js";
import { ErrorScreen } from "./error-page";

const defaultGetLocale = getLocale;

afterEach(() => {
  overwriteGetLocale(defaultGetLocale);
});

/** Renders the error screen for an error, inside a router, because its link needs one. */
function renderErrorScreen(error: unknown): string {
  const Stub = createRoutesStub([
    { path: "/", Component: () => <ErrorScreen error={error} /> },
  ]);
  return renderToStaticMarkup(<Stub />);
}

test("explains an unexpected failure in Bahasa Indonesia", () => {
  const html = renderErrorScreen(new Error("The database is locked."));
  expect(html).toContain("<title>Terjadi kesalahan | Portolab</title>");
  expect(html).toContain("<h1>Terjadi kesalahan</h1>");
  expect(html).toContain(
    "<p>Portolab tidak dapat menampilkan halaman ini. Coba muat ulang halaman. Jika masalahnya berlanjut, beri tahu dosen Anda.</p>",
  );
  expect(html).toContain("Kembali ke beranda</a>");
});

test("explains an unexpected failure in English", () => {
  overwriteGetLocale(() => "en");
  const html = renderErrorScreen(new Error("The database is locked."));
  expect(html).toContain("<title>Something went wrong | Portolab</title>");
  expect(html).toContain("<h1>Something went wrong</h1>");
  expect(html).toContain(
    "<p>Portolab could not show this page. Try reloading the page. If the problem continues, tell your lecturer.</p>",
  );
  expect(html).toContain("Back to the home page</a>");
});
