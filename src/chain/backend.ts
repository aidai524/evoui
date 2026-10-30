import type { Account } from 'near-api-js'
import type {
  CreateArgs,
  CreateResult,
  CurveView,
  LegacySale,
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
