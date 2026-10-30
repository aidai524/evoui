# evoui — UNIZAT frontend

Two complete, independently runnable variants of the UNIZAT UI (NEAR token launch platform: plain mint or bonding curve, optional 4% tax mode that pays holders in wZEC).

| Directory | Theme | Source branch |
|---|---|---|
| [`classic/`](classic/) | Cyber-brutalist light — purple accent, lime status | `main` @ ba63ca5 |
| [`zcash/`](zcash/) | Zcash-leaning shielded dark — Zcash gold, wZEC focus | `theme/zcash` @ 0857678 |

Behaviour, layout and data layer are identical; only the palette (`src/styles/tokens.css`), brand mark and some copy differ.

## Run

```bash
cd classic        # or: cd zcash
npm install
npm run dev       # fake in-memory mode, full UI flow
```

Run both side by side with different ports:

```bash
(cd classic && npx vite --port 5180) & (cd zcash && npx vite --port 5179)
```

See each variant's own README for env modes (`VITE_NOIR_NEAR`, `VITE_CURATE_API`, …) and the contract assumptions.

## UIKit

[`UIKit/`](UIKit/) is the NUI3 component library (99 React components, tokens, themes, docs site) implemented from the spec in `UIKit/spec/` (unpacked from `spec.zip`). See [`UIKit/README.md`](UIKit/README.md).
