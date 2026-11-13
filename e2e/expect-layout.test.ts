import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { contentWidthToken, layoutProblems } from "./expect-layout.ts";

// Each page sets its own width of content, narrower than the phone of the tests, so a rule is broken only where a page breaks it on purpose.
const contentWidth = 200;

/** Shows a page that holds the markup of a test, with the width of content as its token unless the test leaves the token out. */
async function showPage(
  page: Page,
  body: string,
  { hasToken = true }: { hasToken?: boolean } = {},
): Promise<void> {
  const token = hasToken
    ? `:root { ${contentWidthToken}: ${String(contentWidth)}px; }`
    : "";
  await page.setContent(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${token} body { margin: 0; font: 14px sans-serif; } * { box-sizing: border-box; } .card { background: #eee; }</style></head><body>${body}</body></html>`,
  );
}

/** Two tables with the columns of a list of prices, each with a style and with the code of a stock in its first cell. */
function twoTables(style: string, codes: readonly string[]): string {
  return codes
    .map(
      (code) =>
        `<table style="${style}"><thead><tr><th>Kode</th><th>Harga</th></tr></thead><tbody><tr><td>${code}</td><td>9.350</td></tr></tbody></table>`,
    )
    .join("");
}

// The tables of a test take the width of their columns from their own cells unless a style fixes it, so a code wider than the other moves the next column.
const codesOfDifferentWidths = ["BBCA", "BBCAWWWW"];

/** Returns how far one edge or the width of the elements that a selector finds differs among them, so a test can check the state that its page sets up. */
async function spreadOf(
  page: Page,
  selector: string,
  measure: "left" | "right" | "top" | "bottom" | "width",
): Promise<number> {
  const values = await page
    .locator(selector)
    .evaluateAll(
      (elements, key) =>
        elements.map((element) => element.getBoundingClientRect()[key]),
      measure,
    );
  return Math.max(...values) - Math.min(...values);
}

test("accepts a page that keeps every rule of the layout", async ({ page }) => {
  await showPage(
    page,
    `<main data-layout="content" style="max-width: var(${contentWidthToken}); margin: 0 auto">
      <div data-layout="columns" style="display: grid; grid-template-columns: 1fr 1fr; align-items: stretch">
        <section class="card" style="height: 60px">A</section>
        <section class="card">B</section>
      </div>
      <div data-layout="rows">
        <div style="display: grid; grid-template-columns: 60px 1fr 40px"><span>BBCA</span><span style="background: #00f; height: 4px"></span><span>1</span></div>
        <div style="display: grid; grid-template-columns: 60px 1fr 40px"><span>ITMGWW</span><span style="background: #00f; height: 4px"></span><span>22</span></div>
      </div>
      <article data-layout="reading" style="max-width: 120px; margin: 0 auto">Pelajaran</article>
      ${twoTables("table-layout: fixed; width: 100%", codesOfDifferentWidths)}
    </main>`,
  );
  expect(await layoutProblems(page)).toEqual([]);
});

test("rejects a page that scrolls sideways", async ({ page }) => {
  await showPage(page, `<div style="width: 2000px">Lebar</div>`);
  const screenWidth = page.viewportSize()?.width;
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "width",
      text: `The page is 2000 pixels wide, but the screen is ${String(screenWidth)} pixels wide, so it scrolls sideways.`,
    },
  ]);
});

test("rejects content wider than the token of the width of content", async ({
  page,
}) => {
  await showPage(
    page,
    `<main data-layout="content" style="width: 300px; margin: 0 auto">Isi</main>`,
  );
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "content",
      text: `The content <main> "Isi" is 300 pixels wide, more than the ${String(contentWidth)} pixels of ${contentWidthToken}.`,
    },
  ]);
});

test("rejects content that marks itself without a token of the width of content", async ({
  page,
}) => {
  await showPage(page, `<main data-layout="content">Isi</main>`, {
    hasToken: false,
  });
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "content",
      text: `The page marks content with data-layout="content", but it defines no token ${contentWidthToken} for the largest width of content.`,
    },
  ]);
});

for (const kind of ["content", "reading"] as const) {
  test(`rejects a ${kind === "content" ? "content" : "reading column"} that stands away from the middle of its parent`, async ({
    page,
  }) => {
    await showPage(
      page,
      `<div style="width: 340px; padding: 0 10px"><main data-layout="${kind}" style="width: ${String(contentWidth)}px; margin-left: 20px">Isi</main></div>`,
    );
    // The parent shows 320 pixels inside its padding, so the 200 pixels of content leave 20 on the left and 100 on the right.
    expect(await layoutProblems(page)).toEqual([
      {
        rule: kind,
        text: `The ${kind === "content" ? "content" : "reading column"} <main> "Isi" is not in the middle of its parent, because the space on its left and the space on its right differ by 80 pixels.`,
      },
    ]);
  });
}

test("rejects columns side by side that end apart", async ({ page }) => {
  await showPage(
    page,
    `<div data-layout="columns" style="display: grid; grid-template-columns: 1fr 1fr; align-items: start">
      <section class="card" style="height: 100px">A</section>
      <section class="card" style="height: 60px">B</section>
    </div>`,
  );
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "columns",
      text: `The columns <section> "A" and <section> "B" of <div> "A B" end 40 pixels apart.`,
    },
  ]);
});

test("rejects a column that stretches while its cards end early", async ({
  page,
}) => {
  await showPage(
    page,
    `<div data-layout="columns" style="display: grid; grid-template-columns: 1fr 1fr; align-items: stretch">
      <div><section class="card" style="height: 60px">A</section></div>
      <section class="card" style="height: 100px">B</section>
    </div>`,
  );
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "columns",
      text: `The columns <div> "A" and <section> "B" of <div> "A B" end 40 pixels apart.`,
    },
  ]);
});

test("accepts columns that stand one above the other", async ({ page }) => {
  await showPage(
    page,
    `<div data-layout="columns" style="display: grid; grid-template-columns: 1fr">
      <section class="card" style="height: 100px">A</section>
      <section class="card" style="height: 60px">B</section>
    </div>`,
  );
  expect(await spreadOf(page, "section", "top")).toBeGreaterThan(2);
  expect(await layoutProblems(page)).toEqual([]);
});

test("accepts parts that a screen hides or places outside the flow, which end apart", async ({
  page,
}) => {
  await showPage(
    page,
    `<div data-layout="columns" style="display: grid; grid-template-columns: 1fr 1fr 1fr; position: relative">
      <section class="card" style="height: 100px">A</section>
      <section class="card" style="height: 100px">B</section>
      <section class="card" style="height: 40px; visibility: hidden">C</section>
      <section class="card" style="height: 40px; position: absolute; top: 0">D</section>
      <section class="card" style="height: 40px; position: fixed; top: 0">E</section>
    </div>`,
  );
  expect(await spreadOf(page, "section", "bottom")).toBeGreaterThan(2);
  expect(await layoutProblems(page)).toEqual([]);
});

test("rejects rows whose bar moves from row to row", async ({ page }) => {
  await showPage(
    page,
    `<div data-layout="rows">
      <div style="display: flex"><span>BBCA</span><span style="background: #00f; width: 40px; height: 4px"></span></div>
      <div style="display: flex"><span>BBCAWW</span><span style="background: #00f; width: 40px; height: 4px"></span></div>
    </div>`,
  );
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "rows",
      text: expect.stringMatching(
        /^The rows of <div> "BBCA BBCAWW" do not share one column template, because the item <span> "" moves \d+\.\d pixels from row to row\.$/,
      ),
    },
  ]);
});

test("rejects rows whose text moves at both of its edges", async ({ page }) => {
  await showPage(
    page,
    `<div data-layout="rows">
      <div style="display: flex; gap: 8px"><span style="width: 40px">A</span><span>9.350</span><span style="width: 30px">B</span></div>
      <div style="display: flex; gap: 8px"><span style="width: 60px">A</span><span>9.350</span><span style="width: 30px">B</span></div>
    </div>`,
  );
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "rows",
      text: `The rows of <div> "A9.350B A9.350B" do not share one column template, because the item <span> "9.350" moves 20.0 pixels from row to row.`,
    },
  ]);
});

test("accepts rows whose text aligns at one edge of its column", async ({
  page,
}) => {
  await showPage(
    page,
    `<div data-layout="rows">
      <div style="display: grid; grid-template-columns: 80px 80px"><span>BBCA</span><span style="justify-self: end">9.350</span></div>
      <div style="display: grid; grid-template-columns: 80px 80px"><span>BBCAWW</span><span style="justify-self: end">350</span></div>
    </div>`,
  );
  expect(await spreadOf(page, "span:nth-child(2)", "left")).toBeGreaterThan(1);
  expect(await layoutProblems(page)).toEqual([]);
});

test("accepts rows whose items wrap like words", async ({ page }) => {
  await showPage(
    page,
    `<div data-layout="rows">
      <div style="display: flex; flex-wrap: wrap"><span>BBCA</span><span style="background: #00f; width: 40px; height: 4px"></span></div>
      <div style="display: flex; flex-wrap: wrap"><span>BBCAWW</span><span style="background: #00f; width: 40px; height: 4px"></span></div>
    </div>`,
  );
  expect(await spreadOf(page, "span:nth-child(2)", "left")).toBeGreaterThan(1);
  expect(await layoutProblems(page)).toEqual([]);
});

test("accepts rows whose phrase of words holds parts of different widths", async ({
  page,
}) => {
  await showPage(
    page,
    `<div data-layout="rows">
      <div style="display: grid; grid-template-columns: 120px"><span style="display: flex"><b>▲</b>+0,81%</span></div>
      <div style="display: grid; grid-template-columns: 120px"><span style="display: flex"><b>▼▼</b>-12,50%</span></div>
    </div>`,
  );
  expect(await spreadOf(page, "b", "width")).toBeGreaterThan(1);
  expect(await layoutProblems(page)).toEqual([]);
});

/** A row whose bar stands at a level of its nesting, at a distance from the start of its grid, inside grids that hold one item each. */
function rowWithBarAtLevel(level: number, barStart: number): string {
  let row = `<div style="display: grid; grid-template-columns: ${String(barStart)}px 40px"><span>A</span><span class="bar" style="background: #00f; height: 4px"></span></div>`;
  for (let wrapper = 1; wrapper < level; wrapper += 1) {
    row = `<div style="display: grid">${row}</div>`;
  }
  return row;
}

test("rejects rows whose bar moves at the fifth level of a row", async ({
  page,
}) => {
  await showPage(
    page,
    `<div data-layout="rows">${rowWithBarAtLevel(5, 60)}${rowWithBarAtLevel(5, 80)}</div>`,
  );
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "rows",
      text: `The rows of <div> "AA" do not share one column template, because the item <span> "" moves 20.0 pixels from row to row.`,
    },
  ]);
});

test("accepts rows whose bar moves below the fifth level of a row", async ({
  page,
}) => {
  await showPage(
    page,
    `<div data-layout="rows">${rowWithBarAtLevel(6, 60)}${rowWithBarAtLevel(6, 80)}</div>`,
  );
  expect(await spreadOf(page, ".bar", "left")).toBeGreaterThan(1);
  expect(await layoutProblems(page)).toEqual([]);
});

test("rejects tables with the same columns that stand one above the other with the columns apart", async ({
  page,
}) => {
  await showPage(page, twoTables("", codesOfDifferentWidths));
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "tables",
      text: expect.stringMatching(
        /^Two tables with the columns Kode, Harga start the column "Harga" \d+\.\d pixels apart\.$/,
      ),
    },
  ]);
});

test("accepts tables with the same columns that stand one above the other with the columns together", async ({
  page,
}) => {
  await showPage(
    page,
    twoTables("table-layout: fixed; width: 300px", codesOfDifferentWidths),
  );
  expect(await layoutProblems(page)).toEqual([]);
});

test("accepts tables with the same columns side by side that start each column at the same place from their own left edge", async ({
  page,
}) => {
  await showPage(
    page,
    `<div style="display: flex; gap: 8px">${twoTables("table-layout: fixed; width: 150px", ["BBCA", "ITMG"])}</div>`,
  );
  expect(await spreadOf(page, "th:nth-child(2)", "left")).toBeGreaterThan(1);
  expect(await layoutProblems(page)).toEqual([]);
});

test("rejects tables with the same columns side by side whose columns start apart from their own left edge", async ({
  page,
}) => {
  await showPage(
    page,
    `<div style="display: flex; gap: 8px">${twoTables("", codesOfDifferentWidths)}</div>`,
  );
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "tables",
      text: expect.stringMatching(
        /^Two tables with the columns Kode, Harga start the column "Harga" \d+\.\d pixels apart\.$/,
      ),
    },
  ]);
});

test("accepts tables with other columns whose columns stand apart", async ({
  page,
}) => {
  await showPage(
    page,
    `${twoTables("", ["BBCA"])}<table><thead><tr><th>Kode</th><th>Nilai</th></tr></thead><tbody><tr><td>BBCAWWWW</td><td>9.350</td></tr></tbody></table>`,
  );
  expect(await spreadOf(page, "th:nth-child(2)", "left")).toBeGreaterThan(1);
  expect(await layoutProblems(page)).toEqual([]);
});

test("rejects a cell that holds more than its column shows", async ({
  page,
}) => {
  await showPage(
    page,
    `<table style="table-layout: fixed; width: 100px"><tbody><tr><td style="overflow: hidden; white-space: nowrap">BBCAWWWWWWWWWWWWWWWWWWWW</td></tr></tbody></table>`,
  );
  expect(await layoutProblems(page)).toEqual([
    {
      rule: "cells",
      text: `The cell <td> "BBCAWWWWWWWWWWWWWWWWWWWW" holds more than its column shows.`,
    },
  ]);
});
