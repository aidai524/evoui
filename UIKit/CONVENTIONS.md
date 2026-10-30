# NUI3 implementation conventions

The spec in `spec/` is the source of truth (`01` hard rules > `03` contract > `04` per-component). This file only records how the spec maps onto this codebase.

## Layout

| What | Where |
| --- | --- |
| Components of group `<g>` | `src/nui3/components/<g>/*.tsx`, all re-exported from `src/nui3/components/<g>/index.ts` |
| CSS of group `<g>` | `src/nui3/css/components/<g>.css`, everything inside `@layer nui3.components { … }` |
| Docs entries of group `<g>` | `src/docs/groups/<g>.docs.tsx` → `export const docs: ComponentDoc[]` (see `src/docs/types.ts`, example `foundation.docs.tsx`) |
| Shared utils | `src/nui3/utils` (amount, address, memo, payments/csv/zip321, ticks, pagination, privacy, `cx`) |
| i18n | `useNuiLocale()` from `src/nui3/i18n` → `{ m, locale, number, t }`; every UI string comes from `m.*` |
| Icons | `src/nui3/icons` (Arrow, External, Copy, Check, Close, Search, Swap, Shield, Lock, Eye, EyeOff, Menu, Chevron, Globe) |
| Tokens | generated `src/nui3/css/tokens.css`; never edit, never hard-code values |

Import inside the kit with relative paths (`../../utils/cx`, `../actions`). Docs files import from `../../nui3`.

## Rules that are easy to break

- Styles use only `var(--nui-*)` semantic/base tokens. No hex, rgb(), px radius, or `box-shadow` elevation (`inset 0 -2px 0 var(--nui-accent)` underline and focus rings are fine). Colour mixing: `color-mix(in srgb, var(--nui-x) 12%, transparent)`.
- Spacing only from the scale: 4/8/12/16/20/24/32/40/48/64/80/100/130 (`--nui-space-1..32`), except the explicit px values written in spec/04 for a component (e.g. chip `gap:26px`, `padding:18px 0`) — follow 04 literally.
- Radius 0 everywhere except logo, token icon, status dot, stepper dot (`--nui-radius-pill`).
- States as attributes (`aria-*`, `data-*`), never modifier classes. Modifiers are `nui-x--variant`, elements `nui-x__part`, one level only.
- Every interactive component implements default / hover / focus-visible / selected / disabled / loading / invalid (03 §3). Inputs: `:focus` → border-focus + `inset 0 -2px 0 var(--nui-accent)`, no outline.
- Keyboard: roving tabindex + ←/→ for ChipGroup / Tabs / Segmented; Dialog/Drawer use native `<dialog>.showModal()`.
- Amounts are `bigint` base units in props; typing keeps decimal strings; display via `formatAmount` (≤ 4 decimals, `<0.0001` never `0`).
- Use `React.useId()` for ids. Components are function components with named exports; props interfaces exported as `<Name>Props`.
- No new dependencies (only `qrcode-generator` is available for ReceiveQR).

## Self-check before finishing

```bash
npx tsc -b          # must be clean for your files
npx vitest run      # utils + contrast must stay green
```

Docs site: `npm run dev` → `#/c/<slug>` where slug comes from `slug()` in `src/docs/types.ts` (`TokenAmountInput` → `token-amount-input`). Language and theme switches are in the header; compact density at the bottom of the sidebar.
