// Shared sample data for docs demos. Addresses are checksum-valid but synthetic (not real wallets).
import { encodeBech32 } from '../nui3/utils/address'

const words = (n: number, seed: number) => Array.from({ length: n }, (_, i) => (i * seed + 3) % 32)

export const ADDR = {
  unified: encodeBech32('u', words(140, 7), 'bech32m'),
  sapling: encodeBech32('zs', words(70, 11), 'bech32'),
  tex: encodeBech32('tex', words(33, 5), 'bech32m'),
  transparent: 't1Rv4exT7bqhZqi2j7xz8bUHDMxwosrjADU',
}

export const TXID = '7f3a9c1e5b2d48a6f0c4e8b1d3a5f7c9e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2'

export interface SampleToken {
  symbol: string
  name: string
  decimals: number
  /** bigint base units */
  balance: bigint
  usd: number
}

export const TOKENS: SampleToken[] = [
  { symbol: 'ZEC', name: 'Zcash', decimals: 8, balance: 250000000n, usd: 47.12 },
  { symbol: 'nZEC', name: 'Noir ZEC', decimals: 8, balance: 1840000000n, usd: 47.1 },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, balance: 1520450000n, usd: 1 },
  { symbol: 'NEAR', name: 'NEAR Protocol', decimals: 24, balance: 42n * 10n ** 24n, usd: 3.41 },
  { symbol: 'ETH', name: 'Ether', decimals: 18, balance: 0n, usd: 3120.5 },
  { symbol: 'wBTC', name: 'Wrapped Bitcoin', decimals: 8, balance: 1250n, usd: 68210 },
]

/** Deterministic random walk (seeded), for charts. */
export function walk(n: number, start = 100, vol = 0.02, seed = 42): number[] {
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const out = [start]
  for (let i = 1; i < n; i++) out.push(Math.max(0.01, out[i - 1] * (1 + (rnd() - 0.48) * vol * 2)))
  return out
}

export const DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 8, 30 + i))
  return d.toISOString().slice(5, 10)
})

export const PRICE_SERIES = walk(30, 46.2, 0.025, 7)

export interface Candle {
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

export const CANDLES: Candle[] = (() => {
  const closes = walk(48, 46, 0.018, 19)
  return closes.map((c, i) => {
    const o = i === 0 ? c * 0.995 : closes[i - 1]
    const hi = Math.max(o, c) * (1 + ((i * 7) % 5) / 400)
    const lo = Math.min(o, c) * (1 - ((i * 3) % 5) / 400)
    return { t: Date.UTC(2026, 9, 1) + i * 3600_000, o, h: hi, l: lo, c, v: 800 + ((i * 137) % 900) }
  })
})()

export const BOOK = {
  bids: Array.from({ length: 12 }, (_, i) => ({ price: 47.1 - i * 0.05, size: 0.8 + ((i * 7) % 5) * 0.6 })),
  asks: Array.from({ length: 12 }, (_, i) => ({ price: 47.15 + i * 0.05, size: 0.6 + ((i * 5) % 6) * 0.5 })),
}
