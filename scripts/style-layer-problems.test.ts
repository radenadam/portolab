import { expect, test } from "vitest";
import { styleLayerProblems } from "./style-layer-problems.ts";

const themeStatement = "@layer theme, parts, features;";

test("accepts a module whose rules lie in the layer of its place, with comments around them", () => {
  expect(
    styleLayerProblems({
      path: "app/features/trading/ticket.module.css",
      text: [
        "/* Why the ticket docks. */",
        "@layer features {",
        "  .ticket { content: '}'; }",
        "  /* A brace } in a comment. */",
        "  @media (width >= 60rem) {",
        "    .ticket { display: grid; }",
        "  }",
        "}",
        "",
      ].join("\n"),
    }),
  ).toEqual([]);
  expect(
    styleLayerProblems({
      path: "app/avatar.module.css",
      text: "@layer parts {\n  .avatar { border-radius: 50%; }\n}\n@layer parts {\n  .large { inline-size: 3rem; }\n}\n",
    }),
  ).toEqual([]);
  expect(
    styleLayerProblems({ path: "app/empty.module.css", text: "" }),
  ).toEqual([]);
});

test("accepts the theme when it starts with the order of the layers", () => {
  expect(
    styleLayerProblems({
      path: "app/theme.css",
      text: `/* The order. */\n${themeStatement}\n\n@layer theme {\n  body { margin: 0; }\n}\n`,
    }),
  ).toEqual([]);
});

test("rejects a rule outside any layer, in a module of every place", () => {
  expect(
    styleLayerProblems({
      path: "app/features/market-data/market-view.module.css",
      text: "@layer features {\n  .table { inline-size: 100%; }\n}\n.head {\n  position: static;\n}\n@media (width >= 74rem) {\n  .head { position: static; }\n}\n",
    }),
  ).toEqual([
    'app/features/market-data/market-view.module.css:4: every rule of the file must lie in the layer "features" of its place, but the rule ".head" lies outside it.',
    'app/features/market-data/market-view.module.css:7: every rule of the file must lie in the layer "features" of its place, but the rule "@media (width >= 74rem)" lies outside it.',
  ]);
  expect(
    styleLayerProblems({
      path: "app/charts/plot.module.css",
      text: "@layer features {\n  .plot { position: relative; }\n}\n",
    }),
  ).toEqual([
    'app/charts/plot.module.css:1: every rule of the file must lie in the layer "parts" of its place, but a block of the layer "features" lies outside it.',
  ]);
  expect(
    styleLayerProblems({
      path: "app/visually-hidden.module.css",
      text: ".text { position: absolute; }\n",
    }),
  ).toEqual([
    'app/visually-hidden.module.css:1: every rule of the file must lie in the layer "parts" of its place, but the rule ".text" lies outside it.',
  ]);
});

test("rejects a block of another layer, a list of layers, and a statement in a module", () => {
  expect(
    styleLayerProblems({
      path: "app/avatar.module.css",
      text: "@layer features {\n  .avatar { border-radius: 50%; }\n}\n@layer parts, features {\n  .large { inline-size: 3rem; }\n}\n@layer parts;\n",
    }),
  ).toEqual([
    'app/avatar.module.css:1: every rule of the file must lie in the layer "parts" of its place, but a block of the layer "features" lies outside it.',
    'app/avatar.module.css:4: every rule of the file must lie in the layer "parts" of its place, but the rule "@layer parts, features" lies outside it.',
    'app/avatar.module.css:7: every rule of the file must lie in the layer "parts" of its place, but the statement of the layers parts lies outside it.',
  ]);
});

test("rejects a theme that does not start with the order of the layers", () => {
  expect(
    styleLayerProblems({
      path: "app/theme.css",
      text: "@layer theme {\n  body { margin: 0; }\n}\n",
    }),
  ).toEqual([
    'app/theme.css:1: the theme must start with the statement "@layer theme, parts, features", which sets the order of the layers before any other style of a page, but it starts with a block of the layer "theme".',
  ]);
  expect(
    styleLayerProblems({
      path: "app/theme.css",
      text: "@layer parts, theme, features;\n@layer theme {\n  body { margin: 0; }\n}\n",
    }),
  ).toEqual([
    'app/theme.css:1: the theme must start with the statement "@layer theme, parts, features", which sets the order of the layers before any other style of a page, but it starts with the statement of the layers parts, theme, features.',
  ]);
  expect(
    styleLayerProblems({
      path: "app/theme.css",
      text: `${themeStatement}\n@layer theme {\n  body { margin: 0; }\n}\nbody { color: red; }\n`,
    }),
  ).toEqual([
    'app/theme.css:5: every rule of the file must lie in the layer "theme" of its place, but the rule "body" lies outside it.',
  ]);
  expect(styleLayerProblems({ path: "app/theme.css", text: "" })).toEqual([
    'app/theme.css:1: the theme must start with the statement "@layer theme, parts, features", which sets the order of the layers before any other style of a page, but it starts with no rule.',
  ]);
});

test("fails on a block or a comment that never ends", () => {
  expect(
    styleLayerProblems({
      path: "app/avatar.module.css",
      text: "@layer parts {\n  .avatar { border-radius: 50%; }\n",
    }),
  ).toEqual([
    'app/avatar.module.css:1: the block of "@layer parts" never closes.',
  ]);
  expect(
    styleLayerProblems({
      path: "app/avatar.module.css",
      text: "/* Open\n@layer parts {\n}\n",
    }),
  ).toEqual(["app/avatar.module.css:1: a comment never ends."]);
  expect(
    styleLayerProblems({
      path: "app/avatar.module.css",
      text: "@layer parts {\n}\n.avatar",
    }),
  ).toEqual([
    'app/avatar.module.css:3: the rule ".avatar" never opens a block or ends.',
  ]);
});
