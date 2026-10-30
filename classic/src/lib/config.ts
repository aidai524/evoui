// Runtime configuration from VITE_* env (see .env.example).
const env = import.meta.env

export const CONFIG = {
  /** VITE_NOIR_NEAR=1 → real testnet signing via a pasted account + key. */
  near: env.VITE_NOIR_NEAR === '1',
  /** VITE_NOIR_INTENTS=1 → Rhea / NEAR Intents path; signing fails loud until NoirWallet ships signBusiness. */
  intents: env.VITE_NOIR_INTENTS === '1',
  networkId: 'testnet',
  rpcUrl: env.VITE_NOIR_RPC ?? 'https://rpc.testnet.near.org',
  factory: env.VITE_NOIR_FACTORY ?? 'tokendeploy.testnet',
  /** Token the curve is priced in. */
  payment: {
    accountId: env.VITE_NOIR_PAYMENT_TOKEN ?? 'wrap.testnet',
    symbol: env.VITE_NOIR_PAYMENT_SYMBOL ?? 'wNEAR',
    decimals: Number(env.VITE_NOIR_PAYMENT_DECIMALS ?? 24),
  },
  /** Optional off-chain index of bot reward distributions (GET <url>?account_id=&token=). */
  rewardsIndexer: env.VITE_NOIR_REWARDS_INDEXER as string | undefined,
  /** VITE_CURATE_API=1 → Curate console talks to /api (proxied to :4123); otherwise in-memory demo data. */
  curateApi: env.VITE_CURATE_API === '1',
} as const

/** Tax mode is fixed this release: 4% transfer tax, 3% to holders in wZEC, 1% to platform. */
export const TAX = {
  totalBps: 400,
  holdersBps: 300,
  platformBps: 100,
  rewardAsset: 'zec.omft.near',
  rewardSymbol: 'wZEC',
  rewardDecimals: 8,
  distributionIntervalMs: 5 * 60 * 1000,
} as const

/** Standard fee mode. */
export const SELL_FEE_BPS = 100

export const nearblocks = {
  address: (id: string) => `https://testnet.nearblocks.io/address/${id}`,
  tx: (hash: string) => `https://testnet.nearblocks.io/txns/${hash}`,
}
