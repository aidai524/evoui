import { useMemo, useState } from 'react'
import { PageHead } from '../../components/Shell'
import { DataCell, Empty, ErrorCallout, Meter, Notice, Reading, SkeletonCard } from '../../components/ui'
import { CONFIG, TAX } from '../../lib/config'
import { bpsToPct, compact, groupInt, shortAccount } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import type { CurveView, TokenInfo } from '../../lib/types'
import { useWallet } from '../../wallet/WalletProvider'
import { curveStats, KindBadge, sig, StatusBadge, supplyLabel, TaxBadge, TokenIcon } from './tokenView'

const PAGE = 12
type Filter = 'all' | 'curve' | 'token' | 'tax'

export function Launches({ onOpenCurve, onCreate }: { onOpenCurve: (t: TokenInfo) => void; onCreate: () => void }) {
  const { backend, version } = useWallet()
  const [pages, setPages] = useState(1)
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  // Enumerate the factory page by page.
  const list = useAsync(async () => {
    const out: TokenInfo[] = []
    for (let i = 0; i < pages; i++) {
      const batch = await backend.getTokens(i * PAGE, PAGE)
      out.push(...batch)
      if (batch.length < PAGE) return { tokens: out, more: false }
    }
    return { tokens: out, more: true }
  }, [backend, pages, version])

  const tokens = list.data?.tokens
  const taxCount = (tokens ?? []).filter((t) => t.tax_enabled).length

  // Curve views for every curve token, fetched in parallel; failures stay per-card.
  const curves = useAsync(async () => {
    const entries = await Promise.all(
      (tokens ?? [])
        .filter((t) => t.curve_account)
        .map(async (t) => {
          try {
            return [t.symbol, await backend.getCurve(t.curve_account!)] as const
          } catch {
            return [t.symbol, null] as const
          }
        }),
    )
    return new Map<string, CurveView | null>(entries)
  }, [tokens])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (tokens ?? []).filter((t) => {
      if (filter === 'curve' && !t.curve_account) return false
      if (filter === 'token' && t.curve_account) return false
      if (filter === 'tax' && !t.tax_enabled) return false
      return !needle || t.symbol.toLowerCase().includes(needle) || t.name.toLowerCase().includes(needle)
    })
  }, [tokens, filter, q])

  return (
    <div>
      <PageHead
        eyebrow="LAUNCH / LAUNCHES"
        title={
          <>
            Launch <span className="accent">shielded</span>
          </>
        }
        lede="Curve positions are booked to an id_commitment, never your account — only aggregates are public. Tax-mode tokens pay holders in wZEC."
      />

      {taxCount > 0 && (
        <div className="tax-strip zec-banner">
          <span>
            <span className="hl">HOLD → EARN {TAX.rewardSymbol.toUpperCase()}</span> — {taxCount} TAX-MODE {taxCount === 1 ? 'TOKEN' : 'TOKENS'} LIVE · {bpsToPct(TAX.holdersBps)} OF EVERY TRANSFER PAID TO HOLDERS
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => { setFilter('tax'); setNotice(null) }}>
            SHOW TAX TOKENS →
          </button>
        </div>
      )}

      <div className="toolbar">
        <div className="filter-chips" role="group" aria-label="Filter tokens">
          {(['all', 'curve', 'token', 'tax'] as Filter[]).map((f) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => { setFilter(f); setNotice(null) }}>
              {f === 'tax' ? 'tax · wZEC' : f}
            </button>
          ))}
        </div>
        <input className="input grow" placeholder="Search symbol or name" value={q} onChange={(e) => { setQ(e.target.value); setNotice(null) }} aria-label="Search tokens" />
        {list.loading && tokens && <Reading />}
      </div>

      {notice && (
        <div style={{ marginBottom: 16 }}>
          <Notice tag="TOKEN">{notice}</Notice>
        </div>
      )}

      {list.error && !tokens ? (
        <ErrorCallout error={list.error} onRetry={list.reload} />
      ) : !tokens ? (
        <div className="stack">
          <Reading label="READING FACTORY" />
          <div className="token-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : tokens.length === 0 ? (
        <Empty
          title="No tokens yet"
          action={
            <button className="btn btn-primary" onClick={onCreate}>
              GO TO CREATE →
            </button>
          }
        >
          The factory hasn't minted anything. Create the first one.
        </Empty>
      ) : shown.length === 0 ? (
        <Empty title="Nothing matches">Clear the filter or search to see all {tokens.length} tokens.</Empty>
      ) : (
        <div className="token-grid">
          {shown.map((t) => (
            <TokenCard
              key={t.token_account}
              token={t}
              curve={curves.data?.get(t.symbol)}
              curveLoading={curves.loading && !curves.data}
              onOpen={() =>
                t.curve_account
                  ? onOpenCurve(t)
                  : setNotice(`${t.symbol} is a plain token — 100% minted to the creator, no curve. Metadata is read-only: ${t.token_account}.`)
              }
            />
          ))}
        </div>
      )}

      {list.data?.more && (
        <div className="row" style={{ marginTop: 24, justifyContent: 'center' }}>
          <button className="btn btn-secondary" disabled={list.loading} onClick={() => setPages((p) => p + 1)}>
            {list.loading ? 'READING…' : 'LOAD MORE'}
          </button>
        </div>
      )}
    </div>
  )
}

function TokenCard({ token, curve, curveLoading, onOpen }: { token: TokenInfo; curve: CurveView | null | undefined; curveLoading: boolean; onOpen: () => void }) {
  const stats = curve ? curveStats(curve) : null
  return (
    <button className="token-card" onClick={onOpen} aria-label={`Open ${token.symbol}`}>
      <div className="token-card-head">
        <div className="row" style={{ gap: 12, minWidth: 0, flexWrap: 'nowrap' }}>
          <TokenIcon token={token} />
          <div style={{ minWidth: 0 }}>
            <div className="token-symbol">{token.symbol}</div>
            <div className="token-name">{token.name}</div>
          </div>
        </div>
        <div className="badge-stack">
          <KindBadge token={token} />
          {token.tax_enabled && <TaxBadge />}
        </div>
      </div>

      <div className="data-grid cols-2">
        <DataCell label="Decimals" value={token.decimals} />
        <DataCell label="Total supply" value={supplyLabel(token)} title={token.total_supply} />
        {token.curve_account && (
          <>
            <DataCell label="Price / unit" value={stats ? sig(stats.price) : curveLoading ? '…' : '—'} sub={CONFIG.payment.symbol} title={stats?.price.toString()} />
            <DataCell label="Market cap" value={stats ? compact(stats.mcap, CONFIG.payment.decimals) : curveLoading ? '…' : '—'} sub={CONFIG.payment.symbol} />
          </>
        )}
      </div>

      {token.curve_account &&
        (curve ? (
          <div>
            <div className="row between" style={{ marginBottom: 6 }}>
              <StatusBadge status={curve.status} />
              <span className="tiny muted">
                {Math.floor(stats!.progress * 100)}% TO GRADUATION
              </span>
            </div>
            <Meter value={stats!.progress} label={`${token.symbol} graduation progress`} />
            <div className="meter-legend">
              <span>{groupInt(curve.units_sold)}</span>
              <span>/ {groupInt(curve.s)} s</span>
            </div>
          </div>
        ) : curve === null ? (
          <span className="tiny" style={{ color: 'var(--negative)' }}>
            ! CURVE VIEW UNAVAILABLE
          </span>
        ) : (
          <div className="skeleton" style={{ height: 8 }} />
        ))}

      <div className="token-card-foot">
        <span>{shortAccount(token.token_account, 28)}</span>
        <span className="go">{token.curve_account ? 'TRADE →' : 'INFO'}</span>
      </div>
    </button>
  )
}
