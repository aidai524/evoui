import type { Account } from 'near-api-js'
import type {
  CreateArgs,
  CreateResult,
  CurveView,
  LegacySale,
  MarketStats,
  PriceBucket,
  Position,
  Rewards,
  TokenInfo,
  TxResult,
} from '../lib/types'

/** Who is signing. `near` is set only in real testnet mode. */
export interface SignerCtx {
  accountId: string
  near?: Account
}

export interface Backend {
  readonly kind: 'fake' | 'near'

  // ── factory reads
  getTokens(fromIndex: number, limit: number): Promise<TokenInfo[]>
  getRequiredDeposit(args: CreateArgs): Promise<bigint>

  // ── curve reads
  getCurve(curveAccount: string): Promise<CurveView>
  getPosition(curveAccount: string, idCommitment: string): Promise<Position>
  getPaymentBalance(accountId: string): Promise<bigint>
  getRewards(accountId: string, idCommitment: string, token: TokenInfo): Promise<Rewards>

  // ── list-view data (keyed by token_account; tokens missing from the result have no data)
  getMarketStats(tokens: TokenInfo[]): Promise<Record<string, MarketStats>>
  /** Token atoms held by this identity: open curve units (id_commitment) + ft balance of the account. */
  getHoldings(accountId: string, idCommitment: string, tokens: TokenInfo[]): Promise<Record<string, string>>
  /** Curve trading since creation in `bucketMs` buckets, oldest first; null when no history source is configured. */
  getPriceHistory(token: TokenInfo, bucketMs: number): Promise<PriceBucket[] | null>

  // ── writes
  createToken(signer: SignerCtx, args: CreateArgs, deposit: bigint): Promise<CreateResult>
  buy(signer: SignerCtx, curveAccount: string, paymentAtoms: bigint, idCommitment: string): Promise<TxResult>
  sell(signer: SignerCtx, curveAccount: string, units: bigint, idCommitment: string): Promise<TxResult>
  claim(signer: SignerCtx, curveAccount: string, idCommitment: string): Promise<TxResult>
  graduate(signer: SignerCtx, curveAccount: string): Promise<TxResult>

  // ── legacy sale (kept, labelled legacy)
  getLegacySales(idCommitment: string): Promise<LegacySale[]>
  legacyCommit(signer: SignerCtx, symbol: string, paymentAtoms: bigint, idCommitment: string): Promise<TxResult>
  legacyClaim(signer: SignerCtx, symbol: string, idCommitment: string): Promise<TxResult>
}

export class ChainError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ChainError'
  }
}
