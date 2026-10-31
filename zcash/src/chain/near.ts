// Real NEAR testnet backend (VITE_NOIR_NEAR=1).
//
// CONTRACT ASSUMPTIONS — the requirements doc names only get_tokens, get_token_required_deposit
// and create_token. Everything else below is the expected interface and is the single place
// to adjust when the contract ABI is final:
//
//   factory  get_tokens({ from_index, limit }) -> TokenInfo[]
//   factory  get_token_required_deposit({ args }) -> U128 (yocto)
//   factory  create_token({ args })  payable
//   curve    get_curve() -> CurveView (u128 as strings)
//   curve    get_position({ id_commitment }) -> { units, claimed }
//   curve    sell({ units, id_commitment })
//   curve    claim({ id_commitment })
//   curve    graduate()  (idempotent: resumes an unfinished migration)
//   payment  ft_transfer_call({ receiver_id: curve, amount, msg: '{"buy":{"id_commitment":…}}' })
//   reward   ft_balance_of({ account_id })   (wZEC, zec.omft.near)
//   token    ft_balance_of({ account_id })   (claimed curve units + plain-token balances)
//
// Market data (created_at, holders, 24h volume / change) is not on chain: it comes from the optional
// VITE_NOIR_STATS_INDEXER; without it the list hides those fields. Price history likewise comes from the
// optional VITE_NOIR_HISTORY_INDEXER.

import { JsonRpcProvider, teraToGas } from 'near-api-js'
import { CONFIG, TAX } from '../lib/config'
import type { CreateArgs, CreateResult, CurveView, LegacySale, MarketStats, Position, PriceBucket, Rewards, RewardEvent, TokenInfo, TxResult } from '../lib/types'
import { ChainError, type Backend, type SignerCtx } from './backend'

const GAS = teraToGas('300')
const GAS_TRADE = teraToGas('150')
const ONE_YOCTO = 1n

export class NearBackend implements Backend {
  readonly kind = 'near' as const
  private provider = new JsonRpcProvider({ url: CONFIG.rpcUrl })
  private intentsOnly: boolean

  constructor(intentsOnly = false) {
    this.intentsOnly = intentsOnly
  }

  private async view<T>(contractId: string, method: string, args: Record<string, unknown> = {}): Promise<T> {
    try {
      return (await this.provider.callFunction({ contractId, method, args })) as T
    } catch (e) {
      throw wrap(e, `${contractId}.${method}`)
    }
  }

  private async call(signer: SignerCtx, contractId: string, methodName: string, args: Record<string, unknown>, deposit: bigint, gas = GAS): Promise<TxResult> {
    if (this.intentsOnly) {
      throw new ChainError(
        'INTENTS_UNAVAILABLE',
        'VITE_NOIR_INTENTS=1: signing goes through NoirWallet.signBusiness, which is not available yet. Nothing was sent.',
      )
    }
    if (!signer.near) throw new ChainError('NO_SIGNER', 'Connect a NEAR testnet account with a key to sign.')
    try {
      const res = (await signer.near.callFunctionRaw({ contractId, methodName, args, deposit, gas })) as unknown as {
        transaction?: { hash?: string }
        transaction_outcome?: { id?: string }
        status?: unknown
      }
      const hash = res.transaction?.hash ?? res.transaction_outcome?.id ?? ''
      const failure = (res.status as { Failure?: unknown } | undefined)?.Failure
      if (failure) throw new ChainError('TX_FAILED', `Transaction ${hash} failed: ${JSON.stringify(failure)}`)
      return { hash }
    } catch (e) {
      throw wrap(e, `${contractId}.${methodName}`)
    }
  }

  getTokens(fromIndex: number, limit: number) {
    return this.view<TokenInfo[]>(CONFIG.factory, 'get_tokens', { from_index: fromIndex, limit })
  }

  async getRequiredDeposit(args: CreateArgs) {
    const v = await this.view<string>(CONFIG.factory, 'get_token_required_deposit', { args })
    return BigInt(v)
  }

  getCurve(curveAccount: string) {
    return this.view<CurveView>(curveAccount, 'get_curve')
  }

  async getPosition(curveAccount: string, idCommitment: string) {
    const p = await this.view<Position | null>(curveAccount, 'get_position', { id_commitment: idCommitment })
    return p ?? { units: '0', claimed: '0' }
  }

  async getPaymentBalance(accountId: string) {
    const v = await this.view<string>(CONFIG.payment.accountId, 'ft_balance_of', { account_id: accountId })
    return BigInt(v ?? '0')
  }

  async getRewards(accountId: string, idCommitment: string, token: TokenInfo): Promise<Rewards> {
    const asset = token.reward_asset ?? TAX.rewardAsset
    const [balance, pos, curve] = await Promise.all([
      this.view<string>(asset, 'ft_balance_of', { account_id: accountId }).catch(() => null),
      token.curve_account ? this.getPosition(token.curve_account, idCommitment) : Promise.resolve({ units: '0', claimed: '0' }),
      token.curve_account ? this.getCurve(token.curve_account).catch(() => null) : Promise.resolve(null),
    ])
    let history: RewardEvent[] = []
    let next: number | null = null
    if (CONFIG.rewardsIndexer) {
      const url = `${CONFIG.rewardsIndexer}?account_id=${encodeURIComponent(accountId)}&token=${encodeURIComponent(token.token_account)}`
      const r = await fetch(url)
      if (!r.ok) throw new ChainError('INDEXER', `Rewards indexer returned ${r.status}.`)
      const body = (await r.json()) as { history?: RewardEvent[]; next_distribution_at?: number }
      history = body.history ?? []
      next = body.next_distribution_at ?? null
    }
    const total = history.reduce((a, e) => a + BigInt(e.amount), 0n)
    const sold = curve ? BigInt(curve.units_sold) : 0n
    const units = BigInt(pos.units)
    return {
      total: total.toString(),
      balance,
      next_distribution_at: next,
      units: pos.units,
      share_bps: sold === 0n ? 0 : Number((units * 10000n) / sold),
      history,
    }
  }

  async getMarketStats(tokens: TokenInfo[]): Promise<Record<string, MarketStats>> {
    if (!CONFIG.statsIndexer || tokens.length === 0) return {}
    const url = `${CONFIG.statsIndexer}?tokens=${tokens.map((t) => encodeURIComponent(t.token_account)).join(',')}`
    const r = await fetch(url)
    if (!r.ok) throw new ChainError('INDEXER', `Stats indexer returned ${r.status}.`)
    const rows = (await r.json()) as (Partial<MarketStats> & { token_account: string })[]
    const out: Record<string, MarketStats> = {}
    for (const row of rows) {
      out[row.token_account] = {
        created_at: row.created_at ?? null,
        holders: row.holders ?? null,
        volume_24h: row.volume_24h ?? null,
        change_24h_bps: row.change_24h_bps ?? null,
      }
    }
    return out
  }

  async getHoldings(accountId: string, idCommitment: string, tokens: TokenInfo[]): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    await Promise.all(
      tokens.map(async (t) => {
        // Per-token failures (e.g. a token without storage for this account) just mean "no holding".
        const [ft, pos] = await Promise.all([
          this.view<string>(t.token_account, 'ft_balance_of', { account_id: accountId }).catch(() => '0'),
          t.curve_account ? this.getPosition(t.curve_account, idCommitment).catch(() => null) : Promise.resolve(null),
        ])
        const open = pos ? BigInt(pos.units) - BigInt(pos.claimed) : 0n
        const atoms = BigInt(ft ?? '0') + open * 10n ** BigInt(t.decimals)
        if (atoms > 0n) out[t.token_account] = atoms.toString()
      }),
    )
    return out
  }

  async getPriceHistory(token: TokenInfo, bucketMs: number): Promise<PriceBucket[] | null> {
    if (!CONFIG.historyIndexer) return null
    const r = await fetch(`${CONFIG.historyIndexer}?token=${encodeURIComponent(token.token_account)}&bucket=${bucketMs}`)
    if (!r.ok) throw new ChainError('INDEXER', `History indexer returned ${r.status}.`)
    return (await r.json()) as PriceBucket[]
  }

  async createToken(signer: SignerCtx, args: CreateArgs, deposit: bigint): Promise<CreateResult> {
    const tx = await this.call(signer, CONFIG.factory, 'create_token', { args }, deposit)
    const tokenAccount = `${args.symbol.toLowerCase()}.${CONFIG.factory}`
    return { ...tx, token_account: tokenAccount, curve_account: args.use_curve ? `curve.${tokenAccount}` : null }
  }

  buy(signer: SignerCtx, curveAccount: string, paymentAtoms: bigint, idCommitment: string) {
    return this.call(
      signer,
      CONFIG.payment.accountId,
      'ft_transfer_call',
      { receiver_id: curveAccount, amount: paymentAtoms.toString(), msg: JSON.stringify({ buy: { id_commitment: idCommitment } }) },
      ONE_YOCTO,
      GAS_TRADE,
    )
  }

  sell(signer: SignerCtx, curveAccount: string, units: bigint, idCommitment: string) {
    return this.call(signer, curveAccount, 'sell', { units: units.toString(), id_commitment: idCommitment }, ONE_YOCTO, GAS_TRADE)
  }

  claim(signer: SignerCtx, curveAccount: string, idCommitment: string) {
    return this.call(signer, curveAccount, 'claim', { id_commitment: idCommitment }, ONE_YOCTO, GAS_TRADE)
  }

  graduate(signer: SignerCtx, curveAccount: string) {
    return this.call(signer, curveAccount, 'graduate', {}, 0n, GAS)
  }

  async getLegacySales(): Promise<LegacySale[]> {
    return []
  }

  async legacyCommit(): Promise<TxResult> {
    throw new ChainError('LEGACY', 'Legacy sale flow is not wired to testnet.')
  }

  async legacyClaim(): Promise<TxResult> {
    throw new ChainError('LEGACY', 'Legacy sale flow is not wired to testnet.')
  }
}

function wrap(e: unknown, where: string): Error {
  if (e instanceof ChainError) return e
  const msg = e instanceof Error ? e.message : String(e)
  return new ChainError('RPC', `${where}: ${msg}`)
}
