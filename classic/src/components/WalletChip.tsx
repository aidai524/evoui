import { useEffect, useRef, useState } from 'react'
import { CONFIG, nearblocks } from '../lib/config'
import { fromAtoms, shortAccount, shortHex } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { useWallet } from '../wallet/WalletProvider'
import { errorText, Field, Notice } from './ui'

export function WalletChip() {
  const w = useWallet()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const s = w.session
  const cls = !s ? '' : s.mode === 'simulated' ? 'connected-sim' : 'connected-net'
  const tag = !s ? 'CONNECT' : s.mode === 'simulated' ? 'SIMULATED' : s.mode === 'intents' ? 'INTENTS' : 'TESTNET'

  return (
    <div className="wallet" ref={ref}>
      <button className={`wallet-chip ${cls}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)}>
        <span>{tag}</span>
        {s && <span className="acct">{shortAccount(s.accountId, 20)}</span>}
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="wallet-menu" role="dialog" aria-label="Wallet">
          {s ? <Connected onClose={() => setOpen(false)} /> : <ConnectForm onDone={() => setOpen(false)} />}
        </div>
      )}
    </div>
  )
}

function Connected({ onClose }: { onClose: () => void }) {
  const { session, backend, disconnect, version } = useWallet()
  const bal = useAsync(() => backend.getPaymentBalance(session!.accountId), [session?.accountId, version])
  if (!session) return null
  return (
    <>
      <header className="panel-head">
        <h3>Wallet</h3>
        <span className={`status ${session.mode === 'simulated' ? 'status-simulated' : 'status-online'}`}>{session.mode}</span>
      </header>
      <div className="panel-body">
        <dl className="kv">
          <dt>account</dt>
          <dd>
            {session.mode === 'simulated' ? (
              session.accountId
            ) : (
              <a href={nearblocks.address(session.accountId)} target="_blank" rel="noreferrer">
                {session.accountId} ↗
              </a>
            )}
          </dd>
          <dt>{CONFIG.payment.symbol}</dt>
          <dd>{bal.data !== undefined ? fromAtoms(bal.data, CONFIG.payment.decimals, 4) : bal.error ? '—' : '…'}</dd>
          <dt>id_commitment</dt>
          <dd title={session.idCommitment}>{shortHex(session.idCommitment, 8)}</dd>
        </dl>
        {session.mode === 'intents' && (
          <Notice tone="warning" tag="INTENTS">
            Reads work. Signing goes through NoirWallet <code>signBusiness</code>, which is not available yet — every write fails loud.
          </Notice>
        )}
        <button
          className="btn btn-secondary btn-sm btn-block"
          onClick={() => {
            disconnect()
            onClose()
          }}
        >
          DISCONNECT
        </button>
      </div>
    </>
  )
}

function ConnectForm({ onDone }: { onDone: () => void }) {
  const w = useWallet()
  const [account, setAccount] = useState('')
  const [key, setKey] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    setErr(null)
    try {
      await fn()
      onDone()
    } catch (e) {
      setErr(errorText(e))
    }
  }

  return (
    <>
      <header className="panel-head">
        <h3>Connect</h3>
        <span className={`status ${w.mode === 'simulated' ? 'status-simulated' : 'status-online'}`}>{w.mode}</span>
      </header>
      <div className="panel-body">
        {w.mode === 'simulated' && (
          <>
            <p className="small">
              In-memory demo wallet <code>demo.testnet</code> with 250 {CONFIG.payment.symbol}. Nothing touches a chain.
            </p>
            <button className="btn btn-primary btn-block" disabled={w.connecting} onClick={() => run(w.connectSimulated)}>
              {w.connecting ? 'CONNECTING…' : 'USE SIMULATED WALLET →'}
            </button>
            <p className="tiny muted">Set VITE_NOIR_NEAR=1 to sign on NEAR testnet.</p>
          </>
        )}

        {w.mode === 'testnet' && (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault()
              run(() => w.connectNear(account, key))
            }}
          >
            <Field label="Testnet account" htmlFor="w-acct">
              <input id="w-acct" className="input" placeholder="alice.testnet" value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username" />
            </Field>
            <Field label="Private key" htmlFor="w-key" hint="Held in memory for this tab only. Use a function-call or throwaway testnet key.">
              <input
                id="w-key"
                className="input"
                type="password"
                placeholder="ed25519:…"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <button className="btn btn-primary btn-block" disabled={w.connecting || !account || !key}>
              {w.connecting ? 'CHECKING ACCOUNT…' : 'CONNECT TESTNET →'}
            </button>
          </form>
        )}

        {w.mode === 'intents' && (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault()
              run(() => w.connectIntents(account))
            }}
          >
            <Field label="Account" htmlFor="w-acct-i" hint="Read-only until NoirWallet exposes signBusiness.">
              <input id="w-acct-i" className="input" placeholder="alice.testnet" value={account} onChange={(e) => setAccount(e.target.value)} />
            </Field>
            <button className="btn btn-primary btn-block" disabled={w.connecting || !account}>
              CONNECT (READ-ONLY) →
            </button>
          </form>
        )}

        {err && <Notice tone="error">{err}</Notice>}
      </div>
    </>
  )
}
