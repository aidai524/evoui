# UNIZAT frontend

NEAR token launch platform — plain mint or pump.fun-style bonding curve, with optional **tax mode** (4% transfer tax: 3% to holders in wZEC, 1% platform).
React 19 + Vite + TypeScript + near-api-js. Single page, no router: the top menu switches **Launch / Create / Curate**.

## Run

```bash
npm install
npm run dev        # fake mode: in-memory chain, full UI flow, demo wallet with 250 wNEAR
npm run build      # type-check + production build
```

Copy `.env.example` to `.env.local` to switch modes:

| Env | Effect |
|---|---|
| _(none)_ | Simulated wallet + in-memory factory/curves (seeded with 6 tokens) |
| `VITE_NOIR_NEAR=1` | Real testnet: paste account id + `ed25519:` key in the wallet menu; key is held in memory only |
| `VITE_NOIR_INTENTS=1` | Rhea path: reads work, every write fails loud until NoirWallet ships `signBusiness` |
| `VITE_CURATE_API=1` | Curate console uses `/api` → proxied to `:4123`; `TYPESAFE_API_KEY` is injected by the dev proxy, never bundled |

## Layout

```
src/
  chain/backend.ts     Backend interface (reads + writes)
  chain/fake.ts        In-memory simulation (curve math, tax, wZEC bot every 5 min, graduation, claim)
  chain/near.ts        NEAR testnet backend — ALL contract method names live here
  wallet/              Wallet modes + id_commitment derivation
  sections/launch/     Launches list, Curve page, My wZEC rewards, legacy Commit/Claim/Allocation
  sections/create/     create_token form (use_curve, fee mode, live deposit, args preview)
  sections/curate/     Intake → six-question scoring → append-only decision ledger → schedule → monitor
  styles/              Design tokens + component classes from the spec
```

## Contract assumptions (confirm before testnet)

The spec names only `get_tokens`, `get_token_required_deposit` and `create_token`. The rest is assumed in `src/chain/near.ts`:

- `create_token({ args })` with `args = { symbol, name, decimals, total_supply, use_curve, curve: {s,p0,p1} | null, fee_mode, reference, reference_hash, icon }`; `fee_mode` is `{ SellFee: { bps: 100 } }` or `{ Tax: { total_bps: 400, holders_bps: 300, platform_bps: 100, reward_asset: "zec.omft.near" } }`
- Accounts: token `<symbol>.<factory>`, curve `curve.<symbol>.<factory>`
- Curve views `get_curve()`, `get_position({ id_commitment })`; calls `sell`, `claim`, `graduate`
- Buy = `ft_transfer_call` on the payment token (`wrap.testnet`) with `msg: {"buy":{"id_commitment":…}}`
- Units are whole tokens; `p0`/`p1` are payment-token atoms per unit; curve is linear from p0 to p1
- `id_commitment = sha256("<account>:<secret>")`, secret kept in this browser's localStorage
- Reward history comes from an optional indexer (`VITE_NOIR_REWARDS_INDEXER`); balance via `ft_balance_of`
- Curate REST: `GET /applications`, `GET|PUT /applications/:id/score`, `GET|POST /decisions`, `GET|POST /schedule`, `DELETE /schedule/:id`
