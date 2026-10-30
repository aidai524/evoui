# NUI3 UIKit

Implementation of the NUI3 spec in [`spec/`](spec/) (unpacked from `spec.zip`): an editorial, privacy-first UI system for Zcash / Noir apps — tokens, layered CSS, 99 React components, utilities, and the component docs site.

```bash
npm install
npm run dev      # docs site on http://localhost:5173 (regenerates tokens first)
npm test         # utils, 23-pair contrast matrix for every theme, CSS rule checks
npm run build    # tokens → type-check → production build
```

## Layout

```
tokens/nui3.tokens.json        DTCG source of truth (primitive / base / density / paper + night)
scripts/build-tokens.mjs       → src/nui3/css/tokens.css, src/nui3/theme/tokens.generated.ts,
                                 tokens/dist/tokens.json, tokens/dist/tailwind.cjs
src/nui3/
  css/nui3.css                 full bundle: fonts + tokens + base reset + components
  css/components.css           embeddable bundle (no global reset) — wrap in .nui-root / ThemeProvider
  css/components/<group>.css   all inside @layer nui3.components
  components/<group>/          React components (named exports, <Name>Props types)
  theme/                       ThemeProvider, defineTheme, useThemeStyle, checkContrast, contrastRatio
  i18n/                        LocaleProvider / useNuiLocale, en + zh catalogues
  icons/                       12 + required inline SVG icons
  utils/                       amounts (bigint), addresses (bech32/bech32m), memo, ZIP-321, CSV, ticks, pagination
src/docs/                      docs site: registry of 99 entries, demos, guides
tests/                         vitest: utils, contrast matrix, CSS rules
spec/                          the specification (01 → 05)
```

## Using it

```tsx
import '@/nui3/css/nui3.css'          // once, at the app root
import { ThemeProvider, LocaleProvider, ToastProvider, Button } from '@/nui3'

<html data-nui-theme="auto">           // paper | night | auto
<ThemeProvider theme="night" density="compact">
  <LocaleProvider locale="zh">
    <ToastProvider>
      <Button variant="solid" arrow>Sign & send</Button>
    </ToastProvider>
  </LocaleProvider>
</ThemeProvider>
```

Custom themes: `defineTheme({ name, extends: 'night', tokens: { accent, 'accent-hover', 'accent-text', 'focus-ring' } })`, inject with `useThemeStyle(theme)`, then `data-nui-theme={name}`. Always run `checkContrast(theme.tokens)` — the test suite does this for the built-ins and the jade example.

Layer order: `nui3.tokens, nui3.theme, nui3.base, nui3.components, nui3.utilities`. Unlayered app CSS overrides any of them without `!important`.

## Known gaps

- `ZcashMark` is a placeholder drawing (gold circle + Z). Replace it with the official asset before shipping.
- Packages are not published to npm; use the folder as a workspace package or copy `src/nui3`.

## Status

- **A — component library**: done. Tokens, paper / night / auto + compact, layered CSS, utilities, 99 components, docs site with two guides; `AGENTS.md` + `llms.txt` for coding agents, `components.json` downloadable from the AI guide.
- **B — application screens** (portal, 12 product prototypes from `spec/05 §2–3, §6`): not implemented yet; they compose these components.

See [`CONVENTIONS.md`](CONVENTIONS.md) for how the spec maps onto the code.
