import type { CDPSession, Page } from "@playwright/test";

// The build names a class of a CSS module "_name_hash_line", with a hash of the text of its file, as Vite does by default, so the hash names the module of a class.
const moduleClass = /^_[\w-]+_([a-z0-9]{1,5})_\d+$/;
const moduleClassInSelector = /\.(_[\w-]+_[a-z0-9]{1,5}_\d+)/;

/** One declaration that applies to an element, with what the cascade weighs it by. */
interface AppliedDeclaration {
  module: string;
  layer: string;
  specificity: string;
  important: boolean;
  value: string;
  selector: string;
}

/** The section "Interface behavior" of AGENTS.md asks a screen to look the same whatever the order in which the build loads its styles, which axe does not check. Each file of the app puts its rules in the cascade layer of its place, so the order of the layers decides between a rule of a feature and a rule of a shared part. The first style sheet that names a layer names every layer, so it alone sets their order, because the build orders the blocks of a file by the statement at the start of the theme and leaves the statement out once the blocks name every layer. This lists every rule outside a layer, a layer that a later style sheet names first, and every property of an element that two modules of one layer give two values at the same weight, where only the order of loading decides. */
export async function styleOrderProblems(page: Page): Promise<string[]> {
  return [...(await layerProblems(page)), ...(await moduleOrderProblems(page))];
}

async function layerProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = [];
    // Playwright sends this function to the browser as its source, so it holds the helpers that it calls.
    const namesOf = (rule: CSSRule): readonly string[] => {
      if (rule instanceof CSSLayerBlockRule) return [rule.name];
      if (rule instanceof CSSLayerStatementRule) return rule.nameList;
      return [];
    };
    const childrenOf = (rule: CSSRule): CSSRuleList | undefined => {
      if (rule instanceof CSSGroupingRule) return rule.cssRules;
      if (rule instanceof CSSImportRule) return rule.styleSheet?.cssRules;
      return undefined;
    };
    const walk = (
      rules: CSSRuleList,
      layered: boolean,
      sheet: { source: string; names: Set<string> },
    ): void => {
      for (const rule of rules) {
        for (const name of namesOf(rule)) sheet.names.add(name);
        if (rule instanceof CSSStyleRule && !layered)
          found.push(
            `The rule "${rule.selectorText}" of ${sheet.source} lies outside every cascade layer, so it beats every layer.`,
          );
        const children = childrenOf(rule);
        if (children !== undefined)
          walk(children, layered || rule instanceof CSSLayerBlockRule, sheet);
      }
    };
    let first: { source: string; names: Set<string> } | undefined;
    for (const sheet of document.styleSheets) {
      const named = {
        source: sheet.href ?? "a style element",
        names: new Set<string>(),
      };
      walk(sheet.cssRules, false, named);
      if (named.names.size === 0) continue;
      if (first === undefined) {
        first = named;
        continue;
      }
      for (const name of named.names)
        if (!first.names.has(name))
          found.push(
            `The layer "${name}" is first named by ${named.source}, which loads after ${first.source} named the layers ${[...first.names].join(", ")}, so the order of loading sets the order of the layers. The first style sheet that names a layer must name every layer.`,
          );
    }
    return found;
  });
}

/** Lists each property of an element that two modules of one cascade layer give two values at the same weight, so that the module that loads later wins. */
async function moduleOrderProblems(page: Page): Promise<string[]> {
  if ((await markElementsOfSeveralModules(page)) === 0) return [];
  const client = await page.context().newCDPSession(page);
  const problems = new Set<string>();
  try {
    await client.send("DOM.enable");
    await client.send("CSS.enable");
    const { root } = await client.send("DOM.getDocument", { depth: 0 });
    const { nodeIds } = await client.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: "[data-style-order]",
    });
    for (const nodeId of nodeIds) {
      const conflicts = conflictsOf(await declarationsOf(client, nodeId));
      if (conflicts.length === 0) continue;
      const { outerHTML } = await client.send("DOM.getOuterHTML", { nodeId });
      const openingTag = outerHTML
        .slice(0, outerHTML.indexOf(">") + 1)
        .replace(' data-style-order=""', "");
      for (const { name, first, second } of conflicts)
        problems.add(
          `${openingTag} takes ${name} from "${first.selector}" and from "${second.selector}", two modules of the layer "${first.layer}" with the same weight, so the module that loads later wins.`,
        );
    }
  } finally {
    await client.detach();
    await page.evaluate(() => {
      for (const element of document.querySelectorAll("[data-style-order]"))
        element.removeAttribute("data-style-order");
    });
  }
  return [...problems];
}

/** Marks the elements that hold the classes of several modules, because only such an element can meet the rules of two modules of one layer. An element with the classes of another in a parent with the same classes meets the same rules, so one of each is enough. */
async function markElementsOfSeveralModules(page: Page): Promise<number> {
  return page.evaluate((pattern) => {
    const classOfModule = new RegExp(pattern);
    const seen = new Set<string>();
    let count = 0;
    for (const element of document.querySelectorAll("[class]")) {
      const modules = new Set<string>();
      for (const name of element.classList) {
        const module = classOfModule.exec(name)?.[1];
        if (module !== undefined) modules.add(module);
      }
      const kind = `${element.getAttribute("class") ?? ""} in ${element.parentElement?.getAttribute("class") ?? ""}`;
      if (modules.size < 2 || seen.has(kind)) continue;
      seen.add(kind);
      element.setAttribute("data-style-order", "");
      count += 1;
    }
    return count;
  }, moduleClass.source);
}

/** The declarations of the rules of the page that apply to an element, by property. A shorthand also lists the longhands that it sets, which stand for it, so a shorthand of one module and a longhand of another meet. */
async function declarationsOf(
  client: CDPSession,
  nodeId: number,
): Promise<Map<string, AppliedDeclaration[]>> {
  const { matchedCSSRules = [] } = await client.send(
    "CSS.getMatchedStylesForNode",
    { nodeId },
  );
  const byProperty = new Map<string, AppliedDeclaration[]>();
  for (const { rule, matchingSelectors } of matchedCSSRules) {
    if (rule.origin !== "regular") continue;
    const shorthands = new Set(
      rule.style.shorthandEntries.map((entry) => entry.name),
    );
    const applied = {
      module: moduleOf(rule.selectorList.text),
      layer: (rule.layers ?? []).map((layer) => layer.text).join("."),
      specificity: weightOf(rule, matchingSelectors),
      selector: rule.selectorList.text,
    };
    for (const property of rule.style.cssProperties) {
      if (property.disabled === true || shorthands.has(property.name)) continue;
      const list = byProperty.get(property.name) ?? [];
      list.push({
        ...applied,
        important: property.important === true,
        value: property.value,
      });
      byProperty.set(property.name, list);
    }
  }
  return byProperty;
}

/** The highest specificity among the selectors of a rule that match an element, written so that a later text sorts above an earlier one. */
function weightOf(
  rule: {
    selectorList: {
      selectors: readonly {
        specificity?: { a: number; b: number; c: number };
      }[];
    };
  },
  matchingSelectors: readonly number[],
): string {
  let weight = "";
  for (const index of matchingSelectors) {
    const specificity = rule.selectorList.selectors[index]?.specificity;
    const candidate = [
      specificity?.a ?? 0,
      specificity?.b ?? 0,
      specificity?.c ?? 0,
    ]
      .map((part) => String(part).padStart(3, "0"))
      .join(",");
    if (candidate > weight) weight = candidate;
  }
  return weight;
}

/** The module of a rule, from the first class of a module in its selector. A rule without one is a rule of the theme. */
function moduleOf(selector: string): string {
  const firstClass = moduleClassInSelector.exec(selector)?.[1];
  const module =
    firstClass === undefined ? undefined : moduleClass.exec(firstClass)?.[1];
  return module ?? "the theme";
}

/** The pairs of declarations of one property from two modules of one layer with the same weight and two values. */
function conflictsOf(
  byProperty: Map<string, AppliedDeclaration[]>,
): { name: string; first: AppliedDeclaration; second: AppliedDeclaration }[] {
  const conflicts: {
    name: string;
    first: AppliedDeclaration;
    second: AppliedDeclaration;
  }[] = [];
  for (const [name, list] of byProperty) {
    for (const [index, first] of list.entries()) {
      for (const second of list
        .slice(index + 1)
        .filter((other) => clash(first, other)))
        conflicts.push({ name, first, second });
    }
  }
  return conflicts;
}

function clash(first: AppliedDeclaration, second: AppliedDeclaration): boolean {
  return (
    first.module !== second.module &&
    first.layer === second.layer &&
    first.specificity === second.specificity &&
    first.important === second.important &&
    first.value !== second.value
  );
}
