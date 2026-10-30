// Shapes shared by the fake and the NEAR backends. Numeric u128 values travel as decimal strings.

export type FeeMode =
  | { SellFee: { bps: number } }
  | { Tax: { total_bps: number; holders_bps: number; platform_bps: number; reward_asset: string } }

export interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  /** Atoms (u128). */
  total_supply: string
  token_account: string
  /** Present when the token was created with use_curve. */
  curve_account: string | null
  tax_enabled: boolean
  reward_asset: string | null
  icon: string | null
  reference: string | null
}

export type CurveStatus = 'TRADING' | 'SOLD_OUT' | 'GRADUATED'

export interface CurveView {
  curve_account: string
  token_account: string
  symbol: string
  decimals: number
  /** Whole units for sale on the curve. */
  s: string
  /** Payment-token atoms per unit at units_sold = 0. */
  p0: string
  /** Payment-token atoms per unit at units_sold = s (graduation price). */
  p1: string
  units_sold: string
  /** Whole units held back for the pool: total − s. */
  reserve_units: string
  /** Payment-token atoms held by the curve. */
  pool_reserve: string
  status: CurveStatus
  fee_mode: FeeMode
  migrated_to_pool: string | null
  pool_id: number | null
  injected: { payment: string; tokens: string } | null
}

export interface Position {
  units: string
  /** Units already claimed as real tokens. */
  claimed: string
}

export interface TxResult {
  hash: string
  detail?: string
}

export interface CreateArgs {
  symbol: string
  name: string
  decimals: number
  /** Atoms. */
  total_supply: string
  use_curve: boolean
  curve: { s: string; p0: string; p1: string } | null
  fee_mode: FeeMode
  reference: string | null
  reference_hash: string | null
  icon: string | null
}

export interface CreateResult extends TxResult {
  token_account: string
  curve_account: string | null
}

export interface RewardEvent {
  at: number
  /** Reward-asset atoms. */
  amount: string
  hash?: string
}

export interface Rewards {
  /** Cumulative reward-asset atoms distributed to this identity. */
  total: string
  /** Current reward-asset balance of the account (ft_balance_of), when known. */
  balance: string | null
  next_distribution_at: number | null
  units: string
  /** Holder share of circulating units in basis points. */
  share_bps: number
  history: RewardEvent[]
}

/** Legacy fixed-price sale (COMMIT / CLAIM / ALLOCATION). */
export interface LegacySale {
  symbol: string
  price: string
  committed_total: string
  cap: string
  ends_at: number
  my_commit: string
  my_allocation_units: string
  claimed: boolean
}
