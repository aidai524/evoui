import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PageHead } from '../../components/Shell'
import { Badge, Empty, ErrorCallout, Meter, Notice, Reading, SkeletonCard, Tween } from '../../components/ui'
import { CONFIG, TAX } from '../../lib/config'
import { age, amountShort, bpsToPct, compact, signedPct } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import type { CurveView, MarketStats, TokenInfo } from '../../lib/types'
import { useWallet } from '../../wallet/WalletProvider'
import { currentDecisions, curateApi } from '../curate/api'
import { curveStats, TokenIcon } from './tokenView'
import { artPattern, ART_PATTERNS, TokenArt } from './TokenArt'

const PAGE = 12
const FEATURED_MAX = 3
type Filter = 'all' | 'curve' | 'token' | 'tax'
type Pick = { token: TokenInfo; reason: 'CURATED' | 'TRENDING' }

/** Per-card data assembled from the separate reads; `undefined` = still loading, `null` = not available. */
interface CardData {
  curve: CurveView | null | undefined
  stats: MarketStats | null | undefined
  /** Token atoms held by the connected identity; undefined when no wallet is connected. */
  held: string | null | undefined
}

export function Launches({ onOpenCurve, onCreate }: { onOpenCurve: (t: TokenInfo) => void; onCreate: () => void }) {
  const { backend, version, session } = useWallet()
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

  // Market data is optional (indexer in testnet mode): a failure just hides the fields.
  const stats = useAsync(
    (): Promise<Record<string, MarketStats>> => (tokens ? backend.getMarketStats(tokens).catch(() => ({})) : Promise.resolve({})),
    [tokens],
  )

  const holdings = useAsync(
    (): Promise<Record<string, string> | null> =>
      session && tokens ? backend.getHoldings(session.accountId, session.idCommitment, tokens).catch(() => ({})) : Promise.resolve(null),
    [tokens, session?.idCommitment],
  )

  // Curator picks: applications with a current RECOMMEND in the decision ledger.
  const curated = useAsync(async () => {
    try {
      const [apps, ledger] = await Promise.all([curateApi.applications(), curateApi.decisions()])
      const current = currentDecisions(ledger)
      return apps.filter((a) => current.get(a.id)?.decision === 'RECOMMEND').map((a) => a.symbol)
    } catch {
      return []
    }
  }, [])

  const dataFor = (t: TokenInfo): CardData => ({
    curve: t.curve_account ? (curves.data ? (curves.data.get(t.symbol) ?? null) : undefined) : null,
    stats: stats.data ? (stats.data[t.token_account] ?? null) : undefined,
    held: session ? (holdings.data ? (holdings.data[t.token_account] ?? null) : undefined) : undefined,
  })

  const picks = useMemo<Pick[]>(() => {
    if (!tokens || !curves.data) return []
    const live = (t: TokenInfo) => !!t.curve_account && curves.data!.get(t.symbol)?.status === 'TRADING'
    const out: Pick[] = []
    for (const sym of curated.data ?? []) {
      const t = tokens.find((x) => x.symbol === sym)
      if (t && live(t) && out.length < FEATURED_MAX) out.push({ token: t, reason: 'CURATED' })
    }
    // Fill with the most-traded live curves (24h volume, then graduation progress).
    const vol = (t: TokenInfo) => BigInt(stats.data?.[t.token_account]?.volume_24h ?? '0')
    const progress = (t: TokenInfo) => BigInt(curves.data!.get(t.symbol)?.units_sold ?? '0') * 10000n / BigInt(curves.data!.get(t.symbol)?.s || '1')
    const rest = tokens
      .filter((t) => live(t) && !out.some((p) => p.token.symbol === t.symbol))
      .sort((a, b) => (vol(b) === vol(a) ? Number(progress(b) - progress(a)) : vol(b) > vol(a) ? 1 : -1))
    for (const t of rest) if (out.length < FEATURED_MAX) out.push({ token: t, reason: 'TRENDING' })
    return out
  }, [tokens, curves.data, stats.data, curated.data])

  // Generated covers side by side should not repeat: bump a clash to the next unused pattern.
  const patterns = useMemo(() => {
    const used: number[] = []
    for (const p of picks) {
      let k = artPattern(p.token.symbol)
      while (used.includes(k) && used.length < ART_PATTERNS) k = (k + 1) % ART_PATTERNS
      used.push(k)
    }
    return used
  }, [picks])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (tokens ?? []).filter((t) => {
      if (filter === 'curve' && !t.curve_account) return false
      if (filter === 'token' && t.curve_account) return false
      if (filter === 'tax' && !t.tax_enabled) return false
      return !needle || t.symbol.toLowerCase().includes(needle) || t.name.toLowerCase().includes(needle)
    })
  }, [tokens, filter, q])

  const open = (t: TokenInfo) =>
    t.curve_account
      ? onOpenCurve(t)
      : setNotice(`${t.symbol} is a plain token — fixed supply minted to the creator, no curve to trade here. Contract: ${t.token_account}.`)

  const browsing = filter === 'all' && !q.trim()

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

      {browsing && picks.length > 0 && (
        <section className="featured" aria-labelledby="featured-title">
          <div className="section-bar">
            <h2 id="featured-title" className="section-bar-title">
              Featured
            </h2>
            <span className="section-bar-note">Curator picks, then the most-traded live curves</span>
          </div>
          <div className={`featured-grid n${picks.length}`}>
            {picks.map((p, i) => (
              <FeaturedCard key={p.token.token_account} pick={p} pattern={patterns[i]} data={dataFor(p.token)} onOpen={() => open(p.token)} />
            ))}
          </div>
        </section>
      )}

      {browsing && tokens && <h2 className="section-bar-title list-title">All tokens</h2>}

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
            <TokenCard key={t.token_account} token={t} data={dataFor(t)} onOpen={() => open(t)} />
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

// ───────────────── cards

function FeaturedCard({ pick, pattern, data, onOpen }: { pick: Pick; pattern: number; data: CardData; onOpen: () => void }) {
  const { token } = pick
  const s = data.curve ? curveStats(data.curve) : null
  return (
    <button className="feature-card" onClick={onOpen} aria-label={`Open ${token.symbol}`}>
      <div className="feature-media">
        <TokenArt token={token} pattern={pattern} />
        <div className="feature-tags">
          <span className={`feature-reason ${pick.reason === 'CURATED' ? 'is-curated' : ''}`}>{pick.reason === 'CURATED' ? '★ Curator pick' : '↗ Trending'}</span>
          {data.held && <HeldTag token={token} atoms={data.held} />}
        </div>
      </div>
      <div className="feature-body">
        <div className="feature-title">
          <div style={{ minWidth: 0 }}>
            <div className="token-symbol">{token.symbol}</div>
            <div className="token-name">
              {token.name}
              {data.stats?.created_at != null && <> · {age(data.stats.created_at)}</>}
            </div>
          </div>
          <Change bps={data.stats?.change_24h_bps} />
        </div>
        {token.tax_enabled && <EarnTag />}
        <Progress token={token} curve={data.curve} />
        <div className="metric-row">
          <Metric label="MCap" strong value={s ? <Tween value={Number(s.mcap)} format={mcapText} /> : data.curve === undefined ? '…' : null} />
          <Metric label="Vol 24h" value={statValue(data.stats, (x) => x.volume_24h && `${amountShort(x.volume_24h, CONFIG.payment.decimals)} ${CONFIG.payment.symbol}`)} />
          <Metric label="Holders" value={statValue(data.stats, (x) => x.holders?.toLocaleString('en-US'))} />
        </div>
      </div>
    </button>
  )
}

function TokenCard({ token, data, onOpen }: { token: TokenInfo; data: CardData; onOpen: () => void }) {
  const s = data.curve ? curveStats(data.curve) : null
  const plain = !token.curve_account
  const status = data.curve?.status
  return (
    <button className={`token-card ${plain ? 'token-card--plain' : ''}`} onClick={onOpen} aria-label={`Open ${token.symbol}`}>
      <div className="token-card-head">
        <div className="row" style={{ gap: 12, minWidth: 0, flexWrap: 'nowrap' }}>
          <TokenIcon token={token} />
          <div style={{ minWidth: 0 }}>
            <div className="token-symbol">{token.symbol}</div>
            <div className="token-name">
              {token.name}
              {data.stats?.created_at != null && <> · {age(data.stats.created_at)}</>}
            </div>
          </div>
        </div>
        <Change bps={data.stats?.change_24h_bps} />
      </div>

      {(token.tax_enabled || data.held || status === 'SOLD_OUT' || status === 'GRADUATED') && (
        <div className="tag-row">
          {token.tax_enabled && <EarnTag />}
          {status === 'SOLD_OUT' && <Badge tone="accent">■ SOLD OUT</Badge>}
          {status === 'GRADUATED' && <Badge tone="positive">● GRADUATED</Badge>}
          {data.held && <HeldTag token={token} atoms={data.held} />}
        </div>
      )}

      {plain ? (
        <div className="plain-line">Fixed supply · no curve — not tradable here</div>
      ) : (
        <Progress token={token} curve={data.curve} />
      )}

      <div className="metric-row">
        {plain ? (
          <Metric label="Supply" strong value={compact(token.total_supply, token.decimals)} />
        ) : (
          <Metric label="MCap" strong value={s ? <Tween value={Number(s.mcap)} format={mcapText} /> : data.curve === undefined ? '…' : null} />
        )}
        {!plain && status !== 'GRADUATED' && <Metric label="Vol 24h" value={statValue(data.stats, (x) => x.volume_24h && `${amountShort(x.volume_24h, CONFIG.payment.decimals)} ${CONFIG.payment.symbol}`)} />}
        <Metric label="Holders" value={statValue(data.stats, (x) => x.holders?.toLocaleString('en-US'))} />
        <span className="card-go" aria-hidden="true">
          →
        </span>
      </div>
    </button>
  )
}

// ───────────────── pieces

function Progress({ token, curve }: { token: TokenInfo; curve: CurveView | null | undefined }) {
  if (curve === undefined) return <div className="skeleton" style={{ height: 34 }} />
  if (curve === null) return <span className="tiny" style={{ color: 'var(--negative)' }}>! CURVE VIEW UNAVAILABLE</span>
  if (curve.status === 'GRADUATED') {
    return (
      <div className="graduated-line">
        Trading on Ref{curve.pool_id != null ? ` · pool #${curve.pool_id}` : ''}
      </div>
    )
  }
  const s = curveStats(curve)
  return (
    <div className="progress-block">
      <div className="progress-head">
        <span className="progress-pct">
          <Tween value={s.progress * 100} format={(n) => `${Math.floor(n)}%`} />
        </span>
        <span className="progress-label">{curve.status === 'SOLD_OUT' ? 'sold out · awaiting graduation' : 'to graduation'}</span>
      </div>
      <Meter value={s.progress} label={`${token.symbol} graduation progress`} live={curve.status === 'TRADING'} />
    </div>
  )
}

function Metric({ label, value, strong }: { label: string; value: ReactNode | null | undefined; strong?: boolean }) {
  if (value == null || value === '') return null
  return (
    <div className={`metric ${strong ? 'metric--strong' : ''}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  )
}

/** Market cap from (tweened) payment atoms. */
const mcapText = (atoms: number) => `${amountShort(BigInt(Math.round(atoms)), CONFIG.payment.decimals)} ${CONFIG.payment.symbol}`

/** '…' while loading, null (hidden) when the backend has no value. */
function statValue(stats: MarketStats | null | undefined, pick: (s: MarketStats) => string | null | undefined): string | null {
  if (stats === undefined) return '…'
  if (stats === null) return null
  return pick(stats) ?? null
}

function Change({ bps }: { bps: number | null | undefined }) {
  // A refresh that moves the value flashes it once (not on first render).
  const prev = useRef(bps)
  const [flashes, setFlashes] = useState(0)
  useEffect(() => {
    if (prev.current != null && bps != null && bps !== prev.current) setFlashes((n) => n + 1)
    prev.current = bps
  }, [bps])
  if (bps == null) return null
  const dir = bps > 0 ? 'up' : bps < 0 ? 'down' : 'flat'
  return (
    <span key={flashes} className={`change change--${dir} ${flashes ? 'change--flash' : ''}`} title="Spot price change, 24h">
      <Tween value={bps} format={(n) => signedPct(Math.round(n))} />
      <span className="change-span">24h</span>
    </span>
  )
}

function EarnTag() {
  return (
    <span className="earn-tag" title={`${bpsToPct(TAX.totalBps)} transfer tax: ${bpsToPct(TAX.holdersBps)} to holders in ${TAX.rewardSymbol}, ${bpsToPct(TAX.platformBps)} platform`}>
      <span className="earn-tag-main">Earn {TAX.rewardSymbol}</span>
      <span className="earn-tag-cost">{bpsToPct(TAX.totalBps)} tax</span>
    </span>
  )
}

function HeldTag({ token, atoms }: { token: TokenInfo; atoms: string }) {
  return (
    <span className="held-tag" title={`This wallet holds ${compact(atoms, token.decimals)} ${token.symbol}`}>
      You hold {compact(atoms, token.decimals)}
    </span>
  )
}
