# AGENTS.md — working on or with NUI3

Read in this order before writing UI:

1. `spec/01-design-principles.md` — the 12 hard rules. Breaking any one fails the work.
2. `CONVENTIONS.md` — where things live in this repo.
3. `llms.txt` — one-screen index of components and utilities.
4. `components.json` — every component's name, group, root class, description and props (download from the docs site: Guides → AI integration).
5. `spec/04-component-reference.md` for the component you are using, and `spec/05-page-recipes.md` for page structure.

## Standing rules

- Compose from NUI3 components. No new colours, radii, shadows, gradients or one-off CSS; change a token or add a component prop instead.
- One `solid` Button per view. Everything else is ghost / outline / subtle / underline / danger.
- Amounts are `bigint` base units. Keep the typed decimal string while editing, `parseUnits` on submit, `formatAmount` to display (≤ 4 decimals in lists, `exact` only on confirmation pages, `<0.0001` never `0`).
- Privacy words are exactly `shielded` / `confidential` / `public`. Never call confidential or public data "private" or "anonymous".
- Public pages (explorer, directories, dashboards) show shielded amounts as `Shielded` and other fields as `Hidden by shielded pool`.
- Bridge, Lending, Perps, Prediction and LaunchPad screens carry a specific `Alert tone="warning"` near the main action.
- Product names never contain "Zcash". The footer disclaimer is always rendered.
- Every input sits in a `Field` with a label (visually hidden if needed). Every icon button has a label.

## Verify

```bash
npm run build   # tokens → tsc → bundle
npm test        # utils, contrast matrix for every theme, CSS rules
```

Then look at the page in paper and night, compact density, keyboard only, and at 390px width.
