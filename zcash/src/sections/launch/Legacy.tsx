import { useState, type ReactNode } from 'react'
import { PageHead } from '../../components/Shell'
import { Badge, DataCell, Empty, ErrorCallout, Field, Meter, Notice, Panel, Reading, TxNotice } from '../../components/ui'
import { CONFIG } from '../../lib/config'
import { clock, fromAtoms, groupInt, relTime, toAtoms } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import type { LegacySale, TokenInfo } from '../../lib/types'
import { useTx } from '../../lib/useTx'
import { useWallet } from '../../wallet/WalletProvider'
import { MyRewards } from './MyRewards'
import { pay } from './tokenView'

function LegacyBanner() {
  return (
    <Notice tone="warning" tag="LEGACY">
      Fixed-price sale flow from before bonding curves. Kept for existing sales; new launches use Create → curve.
    </Notice>
  )
}

function useSales() {
  const { backend, session, version } = useWallet()
  return useAsync(() => backend.getLegacySales(session?.idCommitment ?? ''), [backend, session?.idCommitment, version])
}

function SalesState({ sales, children }: { sales: ReturnType<typeof useSales>; children: (list: LegacySale[]) => ReactNode }) {
  if (sales.error) return <ErrorCallout error={sales.error} onRetry={sales.reload} />
  if (!sales.data) return <Reading />
  if (sales.data.length === 0) return <Empty title="No legacy sales">Nothing on this factory uses the fixed-price sale flow.</Empty>
  return <>{children(sales.data)}</>
}

export function Commit() {
  const { backend, session, bump } = useWallet()
  const sales = useSales()
  const [pick, setPick] = useState<string>('')
  const [amount, setAmount] = useState('')
  const tx = useTx(bump)
  const atoms = amount ? toAtoms(amount, CONFIG.payment.decimals) : null

  return (
    <div className="stack-lg">
      <PageHead eyebrow="LAUNCH / COMMIT · LEGACY" title="Commit" lede="Commit payment into an open fixed-price sale. Oversubscribed sales allocate pro rata." />
      <LegacyBanner />
      <SalesState sales={sales}>
        {(list) => {
          const open = list.filter((s) => s.ends_at > Date.now())
          const sel = open.find((s) => s.symbol === pick) ?? open[0]
          if (!sel) return <Empty title="No open sales">All legacy sales have closed. Go to Claim.</Empty>
          const fill = Number((BigInt(sel.committed_total) * 1000n) / BigInt(sel.cap)) / 1000
          return (
            <div className="split-even">
              <Panel title="Sale">
                <Field label="Sale" htmlFor="sale-pick">
                  <select id="sale-pick" className="input" value={sel.symbol} onChange={(e) => setPick(e.target.value)}>
                    {open.map((s) => (
                      <option key={s.symbol}>{s.symbol}</option>
                    ))}
                  </select>
                </Field>
                <div className="data-grid cols-2">
                  <DataCell label="Price" value={fromAtoms(sel.price, CONFIG.payment.decimals, 10)} sub={`${CONFIG.payment.symbol} / unit`} />
                  <DataCell label="Closes" value={relTime(sel.ends_at)} sub={clock(sel.ends_at)} />
                  <DataCell label="Committed" value={fromAtoms(sel.committed_total, CONFIG.payment.decimals, 2)} sub={`of ${fromAtoms(sel.cap, CONFIG.payment.decimals, 0)} cap`} />
                  <DataCell label="Yours" value={fromAtoms(sel.my_commit, CONFIG.payment.decimals, 4)} sub={CONFIG.payment.symbol} />
                </div>
                <Meter value={fill} label="Sale fill" />
              </Panel>
              <Panel title="Commit">
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!session || !atoms) return
                    tx.run('COMMITTING', () => backend.legacyCommit(session.signer, sel.symbol, atoms, session.idCommitment)).then((r) => r && setAmount(''))
                  }}
                >
                  <Field label={`Amount (${CONFIG.payment.symbol})`} htmlFor="commit-amt" error={amount && atoms === null ? 'Invalid amount.' : null}>
                    <input id="commit-amt" className="input" inputMode="decimal" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={!session} />
                  </Field>
                  <button className="btn btn-primary btn-block" disabled={!session || !atoms || !!tx.pending}>
                    {tx.pending ? 'COMMITTING…' : 'COMMIT →'}
                  </button>
                  {!session && <p className="tiny muted">Connect a wallet to commit.</p>}
                  {tx.error && <ErrorCallout error={tx.error} />}
                  {tx.result && <TxNotice result={tx.result} />}
                </form>
              </Panel>
            </div>
          )
        }}
      </SalesState>
    </div>
  )
}

export function LegacyClaim() {
  const { backend, session, bump } = useWallet()
  const sales = useSales()
  const tx = useTx(bump)
  return (
    <div className="stack-lg">
      <PageHead eyebrow="LAUNCH / CLAIM · LEGACY" title="Claim" lede="Claim allocations from closed fixed-price sales." />
      <LegacyBanner />
      {!session && <Notice tag="READ-ONLY">Connect a wallet to see and claim your allocations.</Notice>}
      <SalesState sales={sales}>
        {(list) => (
          <div className="panel">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sale</th>
                    <th>Status</th>
                    <th className="num">Committed</th>
                    <th className="num">Allocation</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => {
                    const closed = s.ends_at <= Date.now()
                    const has = BigInt(s.my_commit) > 0n
                    return (
                      <tr key={s.symbol}>
                        <td className="mono">{s.symbol}</td>
                        <td>{closed ? <Badge tone="outline">CLOSED</Badge> : <Badge tone="lime">OPEN · {relTime(s.ends_at)}</Badge>}</td>
                        <td className="num">{pay(s.my_commit, 4)}</td>
                        <td className="num">{groupInt(s.my_allocation_units)}</td>
                        <td className="num">
                          {s.claimed ? (
                            <Badge tone="positive">CLAIMED</Badge>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={!session || !closed || !has || !!tx.pending}
                              onClick={() => session && tx.run('CLAIMING', () => backend.legacyClaim(session.signer, s.symbol, session.idCommitment))}
                            >
                              {tx.pending ? 'CLAIMING…' : 'CLAIM →'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SalesState>
      {tx.error && <ErrorCallout error={tx.error} />}
      {tx.result && <TxNotice result={tx.result} />}
    </div>
  )
}

export function Allocation() {
  const { backend, session, version } = useWallet()
  const sales = useSales()
  const tokens = useAsync(() => backend.getTokens(0, 100), [backend, version])
  const taxTokens = (tokens.data ?? []).filter((t: TokenInfo) => t.tax_enabled && t.curve_account)

  return (
    <div className="stack-lg">
      <PageHead eyebrow="LAUNCH / ALLOCATION" title="Allocation" lede="Your legacy-sale allocations, plus wZEC rewards from every tax-mode token you hold." />

      <section className="stack">
        <span className="eyebrow">MY {`wZEC`} REWARDS</span>
        {!session ? (
          <Notice tag="READ-ONLY">Connect a wallet to see rewards.</Notice>
        ) : tokens.error ? (
          <ErrorCallout error={tokens.error} onRetry={tokens.reload} />
        ) : !tokens.data ? (
          <Reading />
        ) : taxTokens.length === 0 ? (
          <Empty title="No tax-mode tokens">Tokens created with Tax mode pay holders in wZEC. None exist yet.</Empty>
        ) : (
          taxTokens.map((t) => <MyRewards key={t.symbol} token={t} />)
        )}
      </section>

      <section className="stack">
        <span className="eyebrow">LEGACY SALE ALLOCATIONS</span>
        <SalesState sales={sales}>
          {(list) => {
            const mine = list.filter((s) => BigInt(s.my_commit) > 0n)
            if (!session || mine.length === 0) return <Empty title="No allocations">{session ? 'You have not committed to any legacy sale.' : 'Connect a wallet.'}</Empty>
            return (
              <div className="data-grid cols-3">
                {mine.map((s) => (
                  <DataCell key={s.symbol} label={s.symbol} value={groupInt(s.my_allocation_units)} sub={s.claimed ? 'claimed' : `units · from ${pay(s.my_commit, 2)}`} />
                ))}
              </div>
            )
          }}
        </SalesState>
      </section>
    </div>
  )
}
