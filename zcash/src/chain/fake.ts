// In-memory simulated factory + curves. Default `npm run dev` mode: no chain, full UI flow.
// Mirrors the contract semantics the UI depends on (statuses, fees, tax, graduation, claim).

import { CONFIG, SELL_FEE_BPS, TAX } from '../lib/config'
import { costOf, proceedsOf, spotPrice, unitsFor, type CurveParams } from '../lib/curve'
import { randomHex } from '../lib/hooks'
import type {
  CreateArgs,
  CreateResult,
  CurveStatus,
  CurveView,
  FeeMode,
  LegacySale,
  MarketStats,
  Position,
  PriceBucket,
  Rewards,
  RewardEvent,
  TokenInfo,
  TxResult,
} from '../lib/types'
import { ChainError, type Backend, type SignerCtx } from './backend'

const PAY = 10n ** BigInt(CONFIG.payment.decimals)
const ZEC = 10n ** BigInt(TAX.rewardDecimals)
/** Fake bot swap rate: 1 wNEAR → 0.004 wZEC. */
const toZec = (payAtoms: bigint) => (payAtoms * 4n * ZEC) / (1000n * PAY)
const DEPOSIT_CURVE = 4_100_000_000_000_000_000_000_000n // ~4.1 N
const DEPOSIT_PLAIN = 1_930_000_000_000_000_000_000_000n // ~1.93 N
const BLOCK = 600 // simulated latency ms

interface FakePos {
  units: bigint
  claimed: bigint
  owner: string | null
}

interface FakeCurve extends CurveParams {
  sold: bigint
  poolReserve: bigint
  status: CurveStatus
  migratedTo: string | null
  poolId: number | null
  injected: { payment: bigint; tokens: bigint } | null
}

interface FakeToken {
  info: TokenInfo
  feeMode: FeeMode
  curve: FakeCurve | null
  positions: Map<string, FakePos>
  /** Holder share of tax (payment atoms) waiting for the next bot run. */
  pendingHolderTax: bigint
  createdAt: number
  /** Curve fills, oldest first: spot price after the fill and payment atoms moved. */
  trades: { at: number; price: bigint; volume: bigint }[]
  /** Real ft balances (atoms) by account — plain tokens and claimed curve units. */
  ftBalances: Map<string, bigint>
}

const DAY = 86400_000

const wait = (ms = BLOCK) => new Promise((r) => setTimeout(r, ms * (0.6 + Math.random() * 0.8)))
const fakeHash = () => {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  return Array.from({ length: 44 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}
const anon = () => randomHex(32)

export class FakeBackend implements Backend {
  readonly kind = 'fake' as const
  private tokens: FakeToken[] = []
  private balances = new Map<string, bigint>()
  private rewards = new Map<string, { total: bigint; history: RewardEvent[] }>()
  private nextDistribution = Date.now() + TAX.distributionIntervalMs
  private legacy = new Map<string, { price: bigint; cap: bigint; endsAt: number; commits: Map<string, bigint>; claimed: Set<string> }>()

  constructor(demoAccount: string, demoCommitment: string) {
    this.balances.set(demoAccount, 250n * PAY)
    this.seed(demoAccount, demoCommitment)
  }

  // ───────────────── reads

  async getTokens(fromIndex: number, limit: number): Promise<TokenInfo[]> {
    await wait()
    return this.tokens.slice(fromIndex, fromIndex + limit).map((t) => ({ ...t.info }))
  }

  async getRequiredDeposit(args: CreateArgs): Promise<bigint> {
    await wait(250)
    return args.use_curve ? DEPOSIT_CURVE : DEPOSIT_PLAIN
  }

  async getCurve(curveAccount: string): Promise<CurveView> {
    await wait()
    this.runBot()
    const t = this.byCurve(curveAccount)
    const c = t.curve!
    const total = BigInt(t.info.total_supply) / 10n ** BigInt(t.info.decimals)
    return {
      curve_account: curveAccount,
      token_account: t.info.token_account,
      symbol: t.info.symbol,
      decimals: t.info.decimals,
      s: c.s.toString(),
      p0: c.p0.toString(),
      p1: c.p1.toString(),
      units_sold: c.sold.toString(),
      reserve_units: (total - c.s).toString(),
      pool_reserve: c.poolReserve.toString(),
      status: c.status,
      fee_mode: t.feeMode,
      migrated_to_pool: c.migratedTo,
      pool_id: c.poolId,
      injected: c.injected && { payment: c.injected.payment.toString(), tokens: c.injected.tokens.toString() },
    }
  }

  async getPosition(curveAccount: string, idCommitment: string): Promise<Position> {
    await wait(300)
    const p = this.byCurve(curveAccount).positions.get(idCommitment)
    return { units: (p?.units ?? 0n).toString(), claimed: (p?.claimed ?? 0n).toString() }
  }

  async getPaymentBalance(accountId: string): Promise<bigint> {
    await wait(200)
    return this.balances.get(accountId) ?? 0n
  }

  async getRewards(accountId: string, idCommitment: string, token: TokenInfo): Promise<Rewards> {
    await wait(400)
    this.runBot()
    const t = this.bySymbol(token.symbol)
    const mine = t.positions.get(idCommitment)?.units ?? 0n
    const circulating = [...t.positions.values()].reduce((a, p) => a + p.units, 0n)
    const r = this.rewards.get(this.rewardKey(token.symbol, idCommitment))
    void accountId
    return {
      total: (r?.total ?? 0n).toString(),
      balance: (r?.total ?? 0n).toString(),
      next_distribution_at: this.nextDistribution,
      units: mine.toString(),
      share_bps: circulating === 0n ? 0 : Number((mine * 10000n) / circulating),
      history: [...(r?.history ?? [])].reverse(),
    }
  }

  async getMarketStats(tokens: TokenInfo[]): Promise<Record<string, MarketStats>> {
    await wait(350)
    const now = Date.now()
    const out: Record<string, MarketStats> = {}
    for (const info of tokens) {
      const t = this.tokens.find((x) => x.info.token_account === info.token_account)
      if (!t) continue
      const ftHolders = [...t.ftBalances.values()].filter((v) => v > 0n).length
      if (!t.curve) {
        out[info.token_account] = { created_at: t.createdAt, holders: ftHolders, volume_24h: null, change_24h_bps: null }
        continue
      }
      const c = t.curve
      const curveHolders = [...t.positions.values()].filter((p) => p.units > p.claimed).length
      // After graduation trading moves to the pool; the curve has no live market data.
      const live = c.status !== 'GRADUATED'
      const since = now - DAY
      const volume = t.trades.filter((x) => x.at >= since).reduce((a, x) => a + x.volume, 0n)
      const before = [...t.trades].reverse().find((x) => x.at < since)
      const then = before ? before.price : c.p0
      const nowPrice = spotPrice(c, c.sold)
      out[info.token_account] = {
        created_at: t.createdAt,
        holders: curveHolders + ftHolders,
        volume_24h: live ? volume.toString() : null,
        change_24h_bps: live && then > 0n ? Number(((nowPrice - then) * 10000n) / then) : null,
      }
    }
    return out
  }

  async getPriceHistory(info: TokenInfo, bucketMs: number): Promise<PriceBucket[] | null> {
    await wait(250)
    const t = this.tokens.find((x) => x.info.token_account === info.token_account)
    if (!t?.curve) return []
    const c = t.curve
    const trades = [...t.trades].sort((a, b) => a.at - b.at)
    const start = Math.floor(t.createdAt / bucketMs) * bucketMs
    const end = Date.now()
    const out: PriceBucket[] = []
    let price = c.p0
    let i = 0
    for (let b = start; b <= end; b += bucketMs) {
      let volume = 0n
      while (i < trades.length && trades[i].at < b + bucketMs) {
        price = trades[i].price
        volume += trades[i].volume
        i++
      }
      out.push({ t: b, price: price.toString(), volume: volume.toString() })
    }
    return out
  }

  async getHoldings(accountId: string, idCommitment: string, tokens: TokenInfo[]): Promise<Record<string, string>> {
    await wait(300)
    const out: Record<string, string> = {}
    for (const info of tokens) {
      const t = this.tokens.find((x) => x.info.token_account === info.token_account)
      if (!t) continue
      const p = t.positions.get(idCommitment)
      const open = p ? p.units - p.claimed : 0n
      const atoms = open * 10n ** BigInt(info.decimals) + (t.ftBalances.get(accountId) ?? 0n)
      if (atoms > 0n) out[info.token_account] = atoms.toString()
    }
    return out
  }

  // ───────────────── writes

  async createToken(signer: SignerCtx, args: CreateArgs, deposit: bigint): Promise<CreateResult> {
    await wait(1200)
    const symbol = args.symbol.toUpperCase()
    if (this.tokens.some((t) => t.info.symbol === symbol)) {
      throw new ChainError('SYMBOL_TAKEN', `Symbol ${symbol} already exists on this factory.`)
    }
    const need = args.use_curve ? DEPOSIT_CURVE : DEPOSIT_PLAIN
    if (deposit < need) throw new ChainError('DEPOSIT', 'Attached deposit is below the required storage deposit.')
    const tokenAccount = `${symbol.toLowerCase()}.${CONFIG.factory}`
    const curveAccount = args.use_curve ? `curve.${tokenAccount}` : null
    const tax = 'Tax' in args.fee_mode
    this.tokens.unshift({
      info: {
        symbol,
        name: args.name,
        decimals: args.decimals,
        total_supply: args.total_supply,
        token_account: tokenAccount,
        curve_account: curveAccount,
        tax_enabled: tax,
        reward_asset: tax ? TAX.rewardAsset : null,
        icon: args.icon,
        reference: args.reference,
      },
      feeMode: args.fee_mode,
      curve: args.curve && {
        s: BigInt(args.curve.s),
        p0: BigInt(args.curve.p0),
        p1: BigInt(args.curve.p1),
        sold: 0n,
        poolReserve: 0n,
        status: 'TRADING',
        migratedTo: null,
        poolId: null,
        injected: null,
      },
      positions: new Map(),
      pendingHolderTax: 0n,
      createdAt: Date.now(),
      trades: [],
      // Plain mint: 100% of supply to the creator.
      ftBalances: new Map(args.use_curve ? [] : [[signer.accountId, BigInt(args.total_supply)]]),
    })
    return { hash: fakeHash(), token_account: tokenAccount, curve_account: curveAccount }
  }

  async buy(signer: SignerCtx, curveAccount: string, paymentAtoms: bigint, idCommitment: string): Promise<TxResult> {
    await wait(900)
    const t = this.byCurve(curveAccount)
    const c = this.tradable(t)
    const bal = this.balances.get(signer.accountId) ?? 0n
    if (paymentAtoms <= 0n) throw new ChainError('ZERO', 'Amount must be greater than 0.')
    if (bal < paymentAtoms) throw new ChainError('BALANCE', `Insufficient ${CONFIG.payment.symbol} balance.`)

    const taxBps = 'Tax' in t.feeMode ? BigInt(t.feeMode.Tax.total_bps) : 0n
    const tax = (paymentAtoms * taxBps) / 10000n
    const net = paymentAtoms - tax
    const units = unitsFor(c, c.sold, net)
    if (units === 0n) throw new ChainError('TOO_SMALL', 'Amount is below the price of one unit; nothing bought.')
    const cost = costOf(c, c.sold, units)
    const refund = net - cost

    this.balances.set(signer.accountId, bal - paymentAtoms + refund)
    c.sold += units
    c.poolReserve += cost
    if (c.sold === c.s) c.status = 'SOLD_OUT'
    this.addTax(t, tax)
    this.credit(t, idCommitment, units, signer.accountId)
    t.trades.push({ at: Date.now(), price: spotPrice(c, c.sold), volume: cost })

    const parts = [`Bought ${units} units for ${fmtPay(cost)}`]
    if (tax > 0n) parts.push(`tax ${fmtPay(tax)}`)
    if (refund > 0n) parts.push(`refunded ${fmtPay(refund)}`)
    return { hash: fakeHash(), detail: parts.join(' · ') }
  }

  async sell(signer: SignerCtx, curveAccount: string, units: bigint, idCommitment: string): Promise<TxResult> {
    await wait(900)
    const t = this.byCurve(curveAccount)
    const c = this.tradable(t)
    const p = t.positions.get(idCommitment)
    if (units <= 0n) throw new ChainError('ZERO', 'Units must be greater than 0.')
    if (!p || p.units < units) throw new ChainError('BALANCE', 'This id_commitment does not hold that many units.')

    const proceeds = proceedsOf(c, c.sold, units)
    const isTax = 'Tax' in t.feeMode
    const fee = (proceeds * BigInt(isTax ? TAX.totalBps : SELL_FEE_BPS)) / 10000n
    p.units -= units
    c.sold -= units
    c.poolReserve -= proceeds
    if (isTax) this.addTax(t, fee)
    this.balances.set(signer.accountId, (this.balances.get(signer.accountId) ?? 0n) + proceeds - fee)
    t.trades.push({ at: Date.now(), price: spotPrice(c, c.sold), volume: proceeds })
    return { hash: fakeHash(), detail: `Sold ${units} units for ${fmtPay(proceeds - fee)} (fee ${fmtPay(fee)})` }
  }

  async claim(signer: SignerCtx, curveAccount: string, idCommitment: string): Promise<TxResult> {
    await wait(800)
    const t = this.byCurve(curveAccount)
    if (t.curve!.status !== 'GRADUATED') throw new ChainError('NOT_GRADUATED', 'Claim opens after graduation.')
    const p = t.positions.get(idCommitment)
    const open = p ? p.units - p.claimed : 0n
    if (!p || open === 0n) throw new ChainError('NOTHING', 'Nothing to claim for this id_commitment.')
    p.claimed = p.units
    const atoms = open * 10n ** BigInt(t.info.decimals)
    t.ftBalances.set(signer.accountId, (t.ftBalances.get(signer.accountId) ?? 0n) + atoms)
    return { hash: fakeHash(), detail: `Claimed ${open} ${t.info.symbol} to ${signer.accountId}` }
  }

  async graduate(signer: SignerCtx, curveAccount: string): Promise<TxResult> {
    await wait(1400)
    const t = this.byCurve(curveAccount)
    const c = t.curve!
    void signer
    if (c.status === 'GRADUATED') {
      return { hash: fakeHash(), detail: `Migration already complete — pool #${c.poolId} on ${c.migratedTo}. No-op.` }
    }
    if (c.sold !== c.s) throw new ChainError('NOT_SOLD_OUT', 'Graduation requires units_sold == s.')
    const total = BigInt(t.info.total_supply) / 10n ** BigInt(t.info.decimals)
    c.status = 'GRADUATED'
    c.migratedTo = 'Tax' in t.feeMode ? 'dclv2.ref-dev.testnet' : 'ref-finance-101.testnet'
    c.poolId = 1000 + Math.floor(Math.random() * 8000)
    c.injected = { payment: c.poolReserve, tokens: (total - c.s) * 10n ** BigInt(t.info.decimals) }
    return { hash: fakeHash(), detail: `Migrated to ${c.migratedTo} pool #${c.poolId}` }
  }

  // ───────────────── legacy sale

  async getLegacySales(idCommitment: string): Promise<LegacySale[]> {
    await wait(400)
    return [...this.legacy.entries()].map(([symbol, s]) => {
      const total = [...s.commits.values()].reduce((a, b) => a + b, 0n)
      const mine = s.commits.get(idCommitment) ?? 0n
      // Pro-rata if oversubscribed.
      const effective = total > s.cap ? (mine * s.cap) / total : mine
      return {
        symbol,
        price: s.price.toString(),
        committed_total: total.toString(),
        cap: s.cap.toString(),
        ends_at: s.endsAt,
        my_commit: mine.toString(),
        my_allocation_units: (effective / s.price).toString(),
        claimed: s.claimed.has(idCommitment),
      }
    })
  }

  async legacyCommit(signer: SignerCtx, symbol: string, paymentAtoms: bigint, idCommitment: string): Promise<TxResult> {
    await wait(800)
    const s = this.legacy.get(symbol)
    if (!s) throw new ChainError('NO_SALE', 'Unknown sale.')
    if (Date.now() > s.endsAt) throw new ChainError('ENDED', 'Sale window closed.')
    const bal = this.balances.get(signer.accountId) ?? 0n
    if (paymentAtoms <= 0n) throw new ChainError('ZERO', 'Amount must be greater than 0.')
    if (bal < paymentAtoms) throw new ChainError('BALANCE', `Insufficient ${CONFIG.payment.symbol} balance.`)
    this.balances.set(signer.accountId, bal - paymentAtoms)
    s.commits.set(idCommitment, (s.commits.get(idCommitment) ?? 0n) + paymentAtoms)
    return { hash: fakeHash(), detail: `Committed ${fmtPay(paymentAtoms)} to ${symbol}` }
  }

  async legacyClaim(signer: SignerCtx, symbol: string, idCommitment: string): Promise<TxResult> {
    await wait(800)
    const s = this.legacy.get(symbol)
    if (!s) throw new ChainError('NO_SALE', 'Unknown sale.')
    if (Date.now() < s.endsAt) throw new ChainError('OPEN', 'Claim opens when the sale window closes.')
    if (!s.commits.get(idCommitment)) throw new ChainError('NOTHING', 'No commitment from this id_commitment.')
    if (s.claimed.has(idCommitment)) throw new ChainError('CLAIMED', 'Already claimed.')
    s.claimed.add(idCommitment)
    void signer
    return { hash: fakeHash(), detail: `Claimed ${symbol} allocation` }
  }

  // ───────────────── internals

  private byCurve(curveAccount: string): FakeToken {
    const t = this.tokens.find((x) => x.info.curve_account === curveAccount)
    if (!t || !t.curve) throw new ChainError('NOT_FOUND', `No curve at ${curveAccount}.`)
    return t
  }

  private bySymbol(symbol: string): FakeToken {
    const t = this.tokens.find((x) => x.info.symbol === symbol)
    if (!t) throw new ChainError('NOT_FOUND', `No token ${symbol}.`)
    return t
  }

  private tradable(t: FakeToken): FakeCurve {
    const c = t.curve!
    if (c.status !== 'TRADING') throw new ChainError('NOT_TRADING', `Curve is ${c.status.replace('_', ' ')}; trading is closed.`)
    return c
  }

  private credit(t: FakeToken, commitment: string, units: bigint, owner: string | null) {
    const p = t.positions.get(commitment) ?? { units: 0n, claimed: 0n, owner }
    p.units += units
    t.positions.set(commitment, p)
  }

  private addTax(t: FakeToken, tax: bigint) {
    if (tax === 0n || !('Tax' in t.feeMode)) return
    t.pendingHolderTax += (tax * BigInt(t.feeMode.Tax.holders_bps)) / BigInt(t.feeMode.Tax.total_bps)
  }

  private rewardKey(symbol: string, commitment: string) {
    return `${symbol}:${commitment}`
  }

  /** Simulated centralised bot: every 5 min swap pending holder tax → wZEC and split pro rata. */
  private runBot() {
    while (Date.now() >= this.nextDistribution) {
      this.distribute(this.nextDistribution)
      this.nextDistribution += TAX.distributionIntervalMs
    }
  }

  private distribute(at: number) {
    for (const t of this.tokens) {
      if (!('Tax' in t.feeMode) || t.pendingHolderTax === 0n) continue
      const pot = toZec(t.pendingHolderTax)
      const holders = [...t.positions.entries()].filter(([, p]) => p.units > 0n)
      const circ = holders.reduce((a, [, p]) => a + p.units, 0n)
      if (circ === 0n || pot === 0n) continue
      for (const [commitment, p] of holders) {
        const amt = (pot * p.units) / circ
        if (amt === 0n) continue
        const k = this.rewardKey(t.info.symbol, commitment)
        const r = this.rewards.get(k) ?? { total: 0n, history: [] }
        r.total += amt
        r.history.push({ at, amount: amt.toString(), hash: fakeHash() })
        this.rewards.set(k, r)
      }
      t.pendingHolderTax = 0n
    }
  }

  private seed(demoAccount: string, me: string) {
    // Seed prices go down to 1e-8 wNEAR/unit, so keep 12 fractional digits before scaling.
    const nearAtoms = (n: number) => BigInt(Math.round(n * 1e12)) * (PAY / 1_000_000_000_000n)
    const taxMode: FeeMode = {
      Tax: { total_bps: TAX.totalBps, holders_bps: TAX.holdersBps, platform_bps: TAX.platformBps, reward_asset: TAX.rewardAsset },
    }
    const feeMode: FeeMode = { SellFee: { bps: SELL_FEE_BPS } }
    // Demo tokens with cover art in public/covers/<symbol>.webp.
    const covers = new Set(['NEBULAE69M', 'KRILL', 'MOSSDAO', 'ORBITCAT', 'GLYPH'])
    // Test tokens with icons in public/icons/<symbol>.webp.
    const icons = new Set([
      'EMBER', 'LANTERN', 'TIDE', 'FOXGLOVE', 'ANVIL', 'HALO', 'OWLNIGHT', 'COMET', 'BEACON', 'SUNDIAL',
      'MAGMA', 'PRISM', 'OAKROOT', 'KOI', 'ZQ', 'NAUTILUSSPIRAL16', 'HIVE', 'USDTEST', 'ACORN', 'CROWN',
    ])

    const now = Date.now()
    const mk = (o: {
      symbol: string
      name: string
      decimals?: number
      total: bigint
      curve?: { s: bigint; p0: number; p1: number; soldPct: number }
      tax?: boolean
      /** Demo identity's curve units. */
      mine?: bigint
      status?: CurveStatus
      ageHours: number
      /** Distinct anonymous commitments (curve) or accounts (plain) holding the token. */
      holders: number
      /** Fraction of s sold back to the curve in the last few hours (shows a red 24h change). */
      dump?: number
      /** Plain token: whole units the demo account holds. */
      mineFt?: bigint
    }) => {
      const decimals = o.decimals ?? 8
      const scale = 10n ** BigInt(decimals)
      const tokenAccount = `${o.symbol.toLowerCase()}.${CONFIG.factory}`
      const curveAccount = o.curve ? `curve.${tokenAccount}` : null
      const createdAt = now - o.ageHours * 3600_000
      const t: FakeToken = {
        info: {
          symbol: o.symbol,
          name: o.name,
          decimals,
          total_supply: (o.total * scale).toString(),
          token_account: tokenAccount,
          curve_account: curveAccount,
          tax_enabled: !!o.tax,
          reward_asset: o.tax ? TAX.rewardAsset : null,
          icon: icons.has(o.symbol) ? `${import.meta.env.BASE_URL}icons/${o.symbol.toLowerCase()}.webp` : null,
          cover: covers.has(o.symbol) ? `${import.meta.env.BASE_URL}covers/${o.symbol.toLowerCase()}.webp` : null,
          reference: null,
        },
        feeMode: o.tax ? taxMode : feeMode,
        curve: null,
        positions: new Map(),
        pendingHolderTax: 0n,
        createdAt,
        trades: [],
        ftBalances: new Map(),
      }
      if (o.curve) {
        const c: FakeCurve = {
          s: o.curve.s,
          p0: nearAtoms(o.curve.p0),
          p1: nearAtoms(o.curve.p1),
          sold: 0n,
          poolReserve: 0n,
          status: 'TRADING',
          migratedTo: null,
          poolId: null,
          injected: null,
        }
        const target = (o.curve.s * BigInt(Math.round(o.curve.soldPct * 1000))) / 1000n
        const mine = o.mine ?? 0n
        // Split the rest over `holders − 1` anonymous commitments, with uneven sizes, at times spread
        // between creation and now (the newest fills land inside the 24h window).
        const others = Math.max(1, o.holders - (mine > 0n ? 1 : 0))
        const fills = others + (mine > 0n ? 1 : 0)
        const weights = Array.from({ length: others }, (_, i) => 1 + ((i * 37) % 11))
        const wsum = BigInt(weights.reduce((a, w) => a + w, 0))
        const span = now - createdAt
        let remaining = target - mine
        let k = 0
        const fill = (who: string, units: bigint, owner: string | null) => {
          if (units <= 0n) return
          const cost = costOf(c, c.sold, units)
          c.poolReserve += cost
          c.sold += units
          const p = t.positions.get(who) ?? { units: 0n, claimed: 0n, owner }
          p.units += units
          t.positions.set(who, p)
          k++
          t.trades.push({ at: createdAt + Math.floor((span * k) / (fills + 1)), price: spotPrice(c, c.sold), volume: cost })
        }
        const pool = remaining
        for (let i = 0; i < others && remaining > 0n; i++) {
          const take = i === others - 1 ? remaining : (pool * BigInt(weights[i])) / wsum
          const n = take > remaining ? remaining : take
          fill(anon(), n, null)
          remaining -= n
          // The demo identity bought about a third of the way in.
          if (mine > 0n && i === Math.floor(others / 3)) fill(me, mine, demoAccount)
        }
        if (mine > 0n && !t.positions.has(me)) fill(me, mine, demoAccount)
        if (o.dump) {
          // A few recent sells from the largest anonymous holders.
          let left = (o.curve.s * BigInt(Math.round(o.dump * 1000))) / 1000n
          const sellers = [...t.positions.entries()].filter(([id]) => id !== me).sort((x, y) => (y[1].units > x[1].units ? 1 : -1))
          for (let i = 0; i < sellers.length && left > 0n && i < 3; i++) {
            const [, p] = sellers[i]
            const n = left / BigInt(3 - i) > p.units ? p.units : left / BigInt(3 - i)
            const proceeds = proceedsOf(c, c.sold, n)
            p.units -= n
            c.sold -= n
            c.poolReserve -= proceeds
            left -= n
            t.trades.push({ at: now - (3 - i) * 50 * 60_000, price: spotPrice(c, c.sold), volume: proceeds })
          }
        }
        if (c.sold === c.s) c.status = 'SOLD_OUT'
        t.curve = c
        if (o.status === 'GRADUATED') {
          c.status = 'GRADUATED'
          c.migratedTo = o.tax ? 'dclv2.ref-dev.testnet' : 'ref-finance-101.testnet'
          c.poolId = 4127
          c.injected = { payment: c.poolReserve, tokens: (o.total - c.s) * scale }
        }
        if (o.tax) {
          // Some volume already taxed and waiting for the bot; plus a few past runs.
          t.pendingHolderTax = (c.poolReserve * 3n) / 100n
        }
      } else {
        // Plain mint: creator keeps most, a few accounts received transfers.
        const creator = `${o.symbol.toLowerCase()}-deployer.testnet`
        const mineFt = (o.mineFt ?? 0n) * scale
        let rest = o.total * scale - mineFt
        for (let i = 1; i < o.holders - (mineFt > 0n ? 1 : 0); i++) {
          const n = rest / 40n
          t.ftBalances.set(`holder${i}.testnet`, n)
          rest -= n
        }
        if (mineFt > 0n) t.ftBalances.set(demoAccount, mineFt)
        t.ftBalances.set(creator, rest)
      }
      this.tokens.push(t)
      return t
    }

    mk({ symbol: 'NEBULAE69M', name: 'Nebulae 69M', total: 69_000_000n, curve: { s: 55_200_000n, p0: 0.0000004, p1: 0.0000032, soldPct: 0.82 }, tax: true, mine: 1_250_000n, ageHours: 74, holders: 142 })
    mk({ symbol: 'ORBITCAT', name: 'Orbit Cat', total: 1_000_000_000n, curve: { s: 800_000_000n, p0: 0.00000002, p1: 0.00000018, soldPct: 1 }, mine: 12_000_000n, ageHours: 31, holders: 611 })
    mk({ symbol: 'GLYPH', name: 'Glyph Protocol', total: 21_000_000n, curve: { s: 16_800_000n, p0: 0.000002, p1: 0.000016, soldPct: 1 }, tax: true, mine: 40_000n, status: 'GRADUATED', ageHours: 230, holders: 388 })
    mk({ symbol: 'KRILL', name: 'Krill Swarm', total: 420_000_000n, curve: { s: 336_000_000n, p0: 0.00000005, p1: 0.0000004, soldPct: 0.08 }, tax: true, ageHours: 18, holders: 23 })
    mk({ symbol: 'PLAINUSD', name: 'Plain Test Dollar', decimals: 6, total: 10_000_000n, ageHours: 290, holders: 9, mineFt: 2_500n })
    mk({ symbol: 'MOSSDAO', name: 'Moss DAO', total: 5_000_000n, curve: { s: 4_000_000n, p0: 0.00001, p1: 0.00008, soldPct: 0.31 }, ageHours: 146, holders: 57, dump: 0.03 })

    // 20 test tokens covering every state on the page (see the icon doc).
    mk({ symbol: 'EMBER', name: 'Ember Coin', total: 100_000_000n, curve: { s: 80_000_000n, p0: 0.0000003, p1: 0.0000024, soldPct: 0.03 }, tax: true, ageHours: 2, holders: 6 })
    mk({ symbol: 'LANTERN', name: 'Lantern Fund', total: 250_000_000n, curve: { s: 200_000_000n, p0: 0.0000001, p1: 0.0000009, soldPct: 0.15 }, ageHours: 9, holders: 31 })
    mk({ symbol: 'TIDE', name: 'Tide Pool', total: 50_000_000n, curve: { s: 40_000_000n, p0: 0.0000006, p1: 0.000005, soldPct: 0.22 }, tax: true, ageHours: 20, holders: 48 })
    mk({ symbol: 'FOXGLOVE', name: 'Foxglove', total: 10_000_000n, curve: { s: 8_000_000n, p0: 0.000004, p1: 0.00003, soldPct: 0.34 }, ageHours: 40, holders: 66 })
    mk({ symbol: 'ANVIL', name: 'Anvil Works', total: 21_000_000n, curve: { s: 16_800_000n, p0: 0.0000015, p1: 0.000012, soldPct: 0.47 }, tax: true, ageHours: 55, holders: 97 })
    mk({ symbol: 'HALO', name: 'Halo', total: 777_000_000n, curve: { s: 621_600_000n, p0: 0.00000004, p1: 0.0000003, soldPct: 0.55 }, ageHours: 63, holders: 174, dump: 0.05 })
    mk({ symbol: 'OWLNIGHT', name: 'Night Owl', total: 88_000_000n, curve: { s: 70_400_000n, p0: 0.0000003, p1: 0.0000026, soldPct: 0.68 }, tax: true, ageHours: 88, holders: 203 })
    mk({ symbol: 'COMET', name: 'Comet Tail', total: 300_000_000n, curve: { s: 240_000_000n, p0: 0.00000008, p1: 0.0000007, soldPct: 0.76 }, ageHours: 47, holders: 259 })
    mk({ symbol: 'BEACON', name: 'Beacon DAO', total: 12_000_000n, curve: { s: 9_600_000n, p0: 0.000002, p1: 0.000018, soldPct: 0.88 }, tax: true, ageHours: 120, holders: 318 })
    mk({ symbol: 'SUNDIAL', name: 'Sundial', total: 24_000_000n, curve: { s: 19_200_000n, p0: 0.000001, p1: 0.000008, soldPct: 0.97 }, ageHours: 96, holders: 287 })
    mk({ symbol: 'MAGMA', name: 'Magma', total: 66_600_000n, curve: { s: 53_280_000n, p0: 0.0000004, p1: 0.0000035, soldPct: 1 }, tax: true, ageHours: 70, holders: 402 })
    mk({ symbol: 'PRISM', name: 'Prism', total: 7_000_000n, curve: { s: 5_600_000n, p0: 0.000005, p1: 0.00004, soldPct: 1 }, ageHours: 58, holders: 236 })
    mk({ symbol: 'OAKROOT', name: 'Oak Root', total: 40_000_000n, curve: { s: 32_000_000n, p0: 0.0000007, p1: 0.000006, soldPct: 1 }, tax: true, status: 'GRADUATED', ageHours: 310, holders: 455 })
    mk({ symbol: 'KOI', name: 'Koi', total: 888_000_000n, curve: { s: 710_400_000n, p0: 0.00000003, p1: 0.00000025, soldPct: 1 }, status: 'GRADUATED', ageHours: 400, holders: 731 })
    mk({ symbol: 'ZQ', name: 'ZQ', total: 1_000_000n, curve: { s: 800_000n, p0: 0.00003, p1: 0.00025, soldPct: 0.4 }, tax: true, ageHours: 33, holders: 58 })
    mk({ symbol: 'NAUTILUSSPIRAL16', name: 'Nautilus Spiral of the Deep Ocean Long Name Test', total: 160_000_000n, curve: { s: 128_000_000n, p0: 0.00000015, p1: 0.0000012, soldPct: 0.12 }, ageHours: 15, holders: 19 })
    mk({ symbol: 'HIVE', name: 'Hive Collective', total: 60_000_000n, curve: { s: 48_000_000n, p0: 0.0000005, p1: 0.000004, soldPct: 0 }, tax: true, ageHours: 10 / 60, holders: 0 })
    mk({ symbol: 'USDTEST', name: 'Test Stable', decimals: 6, total: 10_000_000n, ageHours: 500, holders: 14 })
    mk({ symbol: 'ACORN', name: 'Acorn', decimals: 18, total: 1_000_000_000_000n, ageHours: 260, holders: 7 })
    mk({ symbol: 'CROWN', name: 'Crown Reserve', total: 100n, ageHours: 180, holders: 3 })

    // Past bot runs for the demo identity on tax tokens.
    for (const sym of ['NEBULAE69M', 'GLYPH']) {
      const history: RewardEvent[] = []
      let total = 0n
      for (let i = 6; i >= 1; i--) {
        const amt = BigInt(1200 + Math.floor(Math.random() * 3800)) * (sym === 'GLYPH' ? 3n : 1n)
        total += amt
        history.push({ at: now - i * TAX.distributionIntervalMs, amount: amt.toString(), hash: fakeHash() })
      }
      this.rewards.set(this.rewardKey(sym, me), { total, history })
    }

    // Legacy fixed-price sales.
    this.legacy.set('MOSSDAO', { price: nearAtoms(0.00001), cap: 500n * PAY, endsAt: now + 3 * 86400_000, commits: new Map([[anon(), 120n * PAY]]), claimed: new Set() })
    this.legacy.set('GLYPH', { price: nearAtoms(0.000002), cap: 50n * PAY, endsAt: now - 86400_000, commits: new Map([[me, 5n * PAY], [anon(), 70n * PAY]]), claimed: new Set() })
  }
}

function fmtPay(atoms: bigint): string {
  const v = Number(atoms) / Number(PAY)
  return `${v.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${CONFIG.payment.symbol}`
}
