# 0071. Styles take their order from cascade layers

- Status: Accepted
- Date: 2026-11-19

## Context

A screen composes shared parts from CSS modules of `app/`, such as the hidden text of `app/visually-hidden.module.css`, and changes some of their properties with a rule of its own feature. Both rules weigh the same, so the rule that loads later wins. The build splits the styles into files by the routes that use them and links them in an order that follows the routes, so a shared module can load after the module of a feature. On 19 November 2026 the head of the table of Pasar stayed hidden on a desktop for this reason, and so did the avatar of the name in the top bar in an earlier round. The dev server loads the same files in another order, so such a defect showed only in the build.

## Decision

- Every style of `app/` lies in one of three cascade layers, which win in this order: `features` over `parts` over `theme`. The theme holds the tokens, the styles of elements, and the global classes, such as `.primary-button`. A module in `app/` outside the features is a shared part, and a module in `app/features/` belongs to its feature. A rule of a later layer beats a rule of an earlier layer whatever their weights and whatever the order in which they load.
- `app/theme.css` starts with the statement `@layer theme, parts, features`, and `app/root.tsx` imports it before any other module, so the statement comes first in the styles of every page and alone sets the order.
- Each file puts all of its rules in one block of the layer of its place. `scripts/check-style-layers.ts` checks this in `pnpm check`.
- Within one layer, the order of loading still decides between two modules. So two modules of one layer never give one property of an element two values at the same weight, and a part that another part of its layer composes keeps its defaults weightless with `:where()`, as `app/panel.module.css` does. `e2e/expect-accessible-screen.ts` checks on every screen that no rule lies outside a layer, that the statement sets the order, and that no element takes a property from two modules of one layer at the same weight.

## Alternatives

- **Rules of more weight.** A feature can repeat a class in its selector or nest it, so that its rule beats the shared one. Each such rule needs its own reason, a later change can lose the weight, and nothing finds the next rule that needs it.
- **Shared modules first.** The root could import every shared module, so that they load before every route. The bundler still decides the order inside a file, the dev server loads them in its own order, and a new shared module that the root forgets brings the defect back.
- **A plugin that wraps each module in its layer.** A plugin of the build could choose the layer from the path, so the files would stay as they are. But a reader of a file would not see its layer, and the dev server and the build would each need the plugin.

## Consequences

- A rule of the theme no longer wins by its weight over a module. A state that the theme styles, such as the hover of `.primary-button`, still shows on a control whose module does not set the same property, and a module that sets it styles the state too.
- Two modules of one layer can still meet on one element, such as a part that composes another part. The check of every screen finds them, and one of the two rules takes `:where()` or the property moves to one module.
- Browsers that Portolab supports have known cascade layers since 2022.
