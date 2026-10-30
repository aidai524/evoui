import { Account, KeyPairSigner } from 'near-api-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Backend, SignerCtx } from '../chain/backend'
import { FakeBackend } from '../chain/fake'
import { NearBackend } from '../chain/near'
import { CONFIG } from '../lib/config'
import { randomHex, sha256Hex } from '../lib/hooks'

export type WalletMode = 'simulated' | 'testnet' | 'intents'

export interface Session {
  accountId: string
  mode: WalletMode
  signer: SignerCtx
  /** Bearer capability: whoever holds this hash controls the curve position. */
  idCommitment: string
}

interface WalletCtx {
  backend: Backend
  /** Which wallet mode this build runs in (from VITE_NOIR_* env). */
  mode: WalletMode
  session: Session | null
  connecting: boolean
  connectSimulated(): Promise<void>
  connectNear(accountId: string, secretKey: string): Promise<void>
  connectIntents(accountId: string): Promise<void>
  disconnect(): void
  /** Bumped after every successful tx so views re-read. */
  version: number
  bump(): void
}

const Ctx = createContext<WalletCtx | null>(null)

const DEMO_ACCOUNT = 'demo.testnet'
const DEMO_SECRET = 'tokendeploy-demo-secret'
const BUILD_MODE: WalletMode = CONFIG.intents ? 'intents' : CONFIG.near ? 'testnet' : 'simulated'

const commitmentOf = (accountId: string, secret: string) => sha256Hex(`${accountId}:${secret}`)

/** Per-account secret behind id_commitment; kept in this browser only. */
function loadSecret(accountId: string): string {
  const key = `tokendeploy.secret.${accountId}`
  try {
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const fresh = randomHex(32)
    localStorage.setItem(key, fresh)
    return fresh
  } catch {
    return randomHex(32)
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (BUILD_MODE === 'simulated') {
      commitmentOf(DEMO_ACCOUNT, DEMO_SECRET).then((c) => setBackend(new FakeBackend(DEMO_ACCOUNT, c)))
    } else {
      setBackend(new NearBackend(BUILD_MODE === 'intents'))
    }
  }, [])

  const connectSimulated = useCallback(async () => {
    setConnecting(true)
    try {
      const idCommitment = await commitmentOf(DEMO_ACCOUNT, DEMO_SECRET)
      setSession({ accountId: DEMO_ACCOUNT, mode: 'simulated', signer: { accountId: DEMO_ACCOUNT }, idCommitment })
    } finally {
      setConnecting(false)
    }
  }, [])

  const connectNear = useCallback(async (accountId: string, secretKey: string) => {
    setConnecting(true)
    try {
      const id = accountId.trim()
      const key = secretKey.trim() as `ed25519:${string}`
      if (!/^ed25519:[1-9A-HJ-NP-Za-km-z]+$/.test(key)) throw new Error('Key must look like ed25519:<base58>.')
      const signer = KeyPairSigner.fromSecretKey(key)
      const account = new Account(id, CONFIG.rpcUrl, signer)
      await account.getState() // throws if the account does not exist
      const pub = (await signer.getPublicKey()).toString()
      await account.getAccessKey(pub).catch(() => {
        throw new Error(`Key ${pub.slice(0, 18)}… is not an access key of ${id}.`)
      })
      const idCommitment = await commitmentOf(id, loadSecret(id))
      setSession({ accountId: id, mode: 'testnet', signer: { accountId: id, near: account }, idCommitment })
    } finally {
      setConnecting(false)
    }
  }, [])

  const connectIntents = useCallback(async (accountId: string) => {
    setConnecting(true)
    try {
      const id = accountId.trim()
      if (!id) throw new Error('Enter an account id.')
      const idCommitment = await commitmentOf(id, loadSecret(id))
      setSession({ accountId: id, mode: 'intents', signer: { accountId: id }, idCommitment })
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => setSession(null), [])
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const value = useMemo<WalletCtx | null>(
    () =>
      backend && {
        backend,
        mode: BUILD_MODE,
        session,
        connecting,
        connectSimulated,
        connectNear,
        connectIntents,
        disconnect,
        version,
        bump,
      },
    [backend, session, connecting, connectSimulated, connectNear, connectIntents, disconnect, version, bump],
  )

  if (!value) {
    return (
      <div className="boot">
        <span className="reading">BOOTING</span>
      </div>
    )
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWallet(): WalletCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWallet outside WalletProvider')
  return v
}
