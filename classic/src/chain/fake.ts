// In-memory simulated factory + curves. Default `npm run dev` mode: no chain, full UI flow.
// Mirrors the contract semantics the UI depends on (statuses, fees, tax, graduation, claim).

import { CONFIG, SELL_FEE_BPS, TAX } from '../lib/config'
import { costOf, proceedsOf, unitsFor, type CurveParams } from '../lib/curve'
import { randomHex } from '../lib/hooks'
import type {
  CreateArgs,
  CreateResult,
  CurveStatus,
  CurveView,
  FeeMode,
  LegacySale,
  Position,
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
}

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
    })
    void signer
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
    void signer
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

    const mk = (o: {
      symbol: string
      name: string
      decimals?: number
      total: bigint
      curve?: { s: bigint; p0: number; p1: number; soldPct: number }
      tax?: boolean
      mine?: bigint
      status?: CurveStatus
    }) => {
      const decimals = o.decimals ?? 8
      const tokenAccount = `${o.symbol.toLowerCase()}.${CONFIG.factory}`
      const curveAccount = o.curve ? `curve.${tokenAccount}` : null
      const t: FakeToken = {
        info: {
          symbol: o.symbol,
          name: o.name,
          decimals,
          total_supply: (o.total * 10n ** BigInt(decimals)).toString(),
          token_account: tokenAccount,
          curve_account: curveAccount,
          tax_enabled: !!o.tax,
          reward_asset: o.tax ? TAX.rewardAsset : null,
          icon: null,
          reference: null,
        },
        feeMode: o.tax ? taxMode : feeMode,
        curve: null,
        positions: new Map(),
        pendingHolderTax: 0n,
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
        // Spread the rest over a handful of anonymous commitments.
        let remaining = target - mine
        const others = 5
        for (let i = 0; i < others && remaining > 0n; i++) {
          const n = i === others - 1 ? remaining : remaining / BigInt(others - i) + BigInt(i * 7)
          const take = n > remaining ? remaining : n
          c.poolReserve += costOf(c, c.sold, take)
          c.sold += take
          t.positions.set(anon(), { units: take, claimed: 0n, owner: null })
          remaining -= take
        }
        if (mine > 0n) {
          c.poolReserve += costOf(c, c.sold, mine)
          c.sold += mine
          t.positions.set(me, { units: mine, claimed: 0n, owner: demoAccount })
        }
        if (c.sold === c.s) c.status = 'SOLD_OUT'
        t.curve = c
        if (o.status === 'GRADUATED') {
          c.status = 'GRADUATED'
          c.migratedTo = o.tax ? 'dclv2.ref-dev.testnet' : 'ref-finance-101.testnet'
          c.poolId = 4127
          c.injected = { payment: c.poolReserve, tokens: (o.total - c.s) * 10n ** BigInt(decimals) }
        }
        if (o.tax) {
          // Some volume already taxed and waiting for the bot; plus a few past runs.
          t.pendingHolderTax = (c.poolReserve * 3n) / 100n
        }
      }
      this.tokens.push(t)
      return t
    }

    mk({ symbol: 'NEBULAE69M', name: 'Nebulae 69M', total: 69_000_000n, curve: { s: 55_200_000n, p0: 0.0000004, p1: 0.0000032, soldPct: 0.62 }, tax: true, mine: 1_250_000n })
    mk({ symbol: 'ORBITCAT', name: 'Orbit Cat', total: 1_000_000_000n, curve: { s: 800_000_000n, p0: 0.00000002, p1: 0.00000018, soldPct: 1 }, mine: 12_000_000n })
    mk({ symbol: 'GLYPH', name: 'Glyph Protocol', total: 21_000_000n, curve: { s: 16_800_000n, p0: 0.000002, p1: 0.000016, soldPct: 1 }, tax: true, mine: 40_000n, status: 'GRADUATED' })
    mk({ symbol: 'KRILL', name: 'Krill Swarm', total: 420_000_000n, curve: { s: 336_000_000n, p0: 0.00000005, p1: 0.0000004, soldPct: 0.08 }, tax: true })
    mk({ symbol: 'PLAINUSD', name: 'Plain Test Dollar', decimals: 6, total: 10_000_000n })
    mk({ symbol: 'MOSSDAO', name: 'Moss DAO', total: 5_000_000n, curve: { s: 4_000_000n, p0: 0.00001, p1: 0.00008, soldPct: 0.31 } })

    // Past bot runs for the demo identity on tax tokens.
    const now = Date.now()
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
