import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const colorSchemes = ["light", "dark"] as const;

/** How a page draws an SVG: its view box, the shapes that could be a ground behind it, and the shape and the stroke of each of its paths. */
interface DrawnIcon {
  viewBox: string | null;
  grounds: number;
  paths: {
    shape: string | null;
    stroke: string;
    fill: string;
    width: string;
  }[];
}

async function drawnIcon(icon: Locator): Promise<DrawnIcon> {
  return icon.evaluate((svg) => ({
    viewBox: svg.getAttribute("viewBox"),
    grounds: svg.querySelectorAll("rect, circle, ellipse, polygon").length,
    paths: Array.from(svg.querySelectorAll("path"), (path) => {
      const style = getComputedStyle(path);
      return {
        shape: path.getAttribute("d"),
        stroke: style.stroke,
        fill: style.fill,
        width: style.strokeWidth,
      };
    }),
  }));
}

/** The color of a token of app/theme.css, in the form in which a page gives a computed stroke. */
async function tokenColor(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

/** Shows a page in a theme, and checks that the page follows it, so a check of colors cannot pass in the other theme. */
async function showInTheme(
  page: Page,
  colorScheme: (typeof colorSchemes)[number],
): Promise<void> {
  await page.emulateMedia({ colorScheme });
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-color-scheme: dark)").matches,
    ),
  ).toBe(colorScheme === "dark");
}

function frameIcon(page: Page): Locator {
  return page
    .getByRole("link", { name: "Portolab", exact: true })
    .locator("svg");
}

test("draws the app icon beside the name without a ground of its own, the flask in the ink and the line in the green of gains of each theme", async ({
  page,
}) => {
  await page.goto("/");
  for (const colorScheme of colorSchemes) {
    await showInTheme(page, colorScheme);
    const icon = await drawnIcon(frameIcon(page));
    expect(icon.grounds).toBe(0);
    expect(icon.paths.map(({ stroke, fill }) => ({ stroke, fill }))).toEqual([
      { stroke: await tokenColor(page, "--color-ink"), fill: "none" },
      { stroke: await tokenColor(page, "--color-gain"), fill: "none" },
    ]);
  }
});

test("gives the browser tab the app icon in the colors that the frame draws it in, in the theme of the device", async ({
  page,
}) => {
  await page.goto("/");
  const address = await page.locator('link[rel="icon"]').getAttribute("href");
  if (address === null) {
    throw new Error("The page links to no icon of its tab.");
  }
  const tab = await page.context().newPage();
  await tab.goto(address);
  for (const colorScheme of colorSchemes) {
    await showInTheme(page, colorScheme);
    await showInTheme(tab, colorScheme);
    expect(await drawnIcon(tab.locator("svg"))).toEqual(
      await drawnIcon(frameIcon(page)),
    );
  }
});

test("sets every figure of the text in the same width, which the font of text draws in different widths of its own", async ({
  page,
}) => {
  await page.goto("/");
  const widths = await page.evaluate(async () => {
    await document.fonts.ready;
    function figureWidths(numeric: string): number[] {
      return Array.from("0123456789", (figure) => {
        const probe = document.createElement("span");
        probe.style.fontVariantNumeric = numeric;
        probe.textContent = figure;
        document.body.append(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return width;
      });
    }
    return { own: figureWidths("normal"), theme: figureWidths("") };
  });
  expect(new Set(widths.own).size).toBeGreaterThan(1);
  expect(new Set(widths.theme).size).toBe(1);
});
