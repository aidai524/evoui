// Curve page charts, drawn as inline SVG at the panel's pixel width (no chart library).
//   Price history — hourly spot price + volume buckets from the backend (hidden without a source).
//   Bonding curve — price as a function of units sold; needs nothing beyond the curve view.

import { useEffect, useId, useRef, useState, type PointerEvent } from 'react'
import { ErrorCallout, Panel } from '../../components/ui'
import { CONFIG } from '../../lib/config'
import { age, amountShort, clock, signedPct } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import type { CurveView, PriceBucket, TokenInfo } from '../../lib/types'
import { useWallet } from '../../wallet/WalletProvider'
import { curveStats, gradStage, sig } from './tokenView'

const HOUR = 3600_000

/** Payment atoms → display units, for plotting only. */
const num = (atoms: bigint | string) => Number(BigInt(atoms)) / 10 ** CONFIG.payment.decimals

/** Axis label: 3 significant digits, never in exponent form (0.000000216, not 2.16e-7). */
const axisNum = (n: number) => (n === 0 ? '0' : n.toFixed(Math.min(20, Math.max(0, 2 - Math.floor(Math.log10(Math.abs(n)))))))

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function CurveCharts({ token, c }: { token: TokenInfo; c: CurveView }) {
  const { backend, version } = useWallet()
  const hist = useAsync(() => backend.getPriceHistory(token, HOUR), [backend, token.token_account, version])
  const b = hist.data
  const first = b?.find((x) => x.volume !== '0') ?? b?.[0]
  const last = b?.[b.length - 1]
  const change = first && last && BigInt(first.price) > 0n ? Number(((BigInt(last.price) - BigInt(first.price)) * 10000n) / BigInt(first.price)) : null

  return (
    <>
      {b !== null && (
        <Panel title="Price history" actions={change != null && <span className="tiny muted">{signedPct(change)} since first trade · 1h buckets</span>}>
          {hist.error && !b ? (
            <ErrorCallout error={hist.error} onRetry={hist.reload} />
          ) : !b ? (
            <div className="skeleton" style={{ height: 268 }} />
          ) : b.length < 2 ? (
            <p className="tiny muted">No trades yet.</p>
          ) : (
            <PriceHistoryChart buckets={b} />
          )}
        </Panel>
      )}
      <Panel title="Bonding curve" actions={<span className="tiny muted">price vs units sold</span>}>
        <BondingCurveChart c={c} />
      </Panel>
    </>
  )
}

// ───────────────── price history

function PriceHistoryChart({ buckets }: { buckets: PriceBucket[] }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const gid = `ph${useId().replace(/[^\w-]/g, '')}`
  const n = buckets.length
  const H = 236
  const pad = { l: 8, r: 88, t: 10, b: 22 }
  const priceH = 150
  const volTop = pad.t + priceH + 14
  const volH = H - pad.b - volTop
  const iw = Math.max(0, w - pad.l - pad.r)

  const prices = buckets.map((b) => num(b.price))
  const vols = buckets.map((b) => num(b.volume))
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  const span = hi - lo || hi || 1
  const pMin = Math.max(0, lo - span * 0.08)
  const pMax = hi + span * 0.08
  const vMax = Math.max(...vols) || 1

  const x = (i: number) => pad.l + (n === 1 ? 0 : (i / (n - 1)) * iw)
  const y = (p: number) => pad.t + priceH - ((p - pMin) / (pMax - pMin)) * priceH
  const line = prices.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join('')
  const area = `${line}L${x(n - 1)},${pad.t + priceH}L${x(0)},${pad.t + priceH}Z`
  const bw = Math.max(1, iw / n - 1)

  const at = hover ?? n - 1
  const sel = buckets[at]
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left - pad.l) / (iw || 1)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  return (
    <div className="chart" ref={ref}>
      <div className="chart-readout">
        <span>{hover == null ? 'Latest' : clock(sel.t)}</span>
        <span>
          <b>{sig(sel.price)}</b> {CONFIG.payment.symbol}
        </span>
        <span>
          vol <b>{amountShort(sel.volume, CONFIG.payment.decimals)}</b> {CONFIG.payment.symbol}
        </span>
      </div>
      {w > 0 && (
        <svg width={w} height={H} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Spot price and volume per hour since launch">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.32" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((k) => {
            const p = pMin + (pMax - pMin) * k
            return (
              <g key={k}>
                <line className="chart-grid" x1={pad.l} x2={pad.l + iw} y1={y(p)} y2={y(p)} />
                <text className="chart-axis" x={pad.l + iw + 8} y={y(p) + 4}>
                  {axisNum(p)}
                </text>
              </g>
            )
          })}
          <path d={area} fill={`url(#${gid})`} />
          <path className="chart-line" d={line} />
          {vols.map((v, i) =>
            v > 0 ? <rect key={i} className={`chart-bar ${i === at ? 'is-on' : ''}`} x={x(i) - bw / 2} width={bw} y={volTop + volH - (v / vMax) * volH} height={(v / vMax) * volH} /> : null,
          )}
          <line className="chart-grid" x1={pad.l} x2={pad.l + iw} y1={volTop + volH} y2={volTop + volH} />
          <text className="chart-axis" x={pad.l + iw + 8} y={volTop + 8}>
            vol
          </text>
          <line className="chart-cursor" x1={x(at)} x2={x(at)} y1={pad.t} y2={volTop + volH} />
          <circle className="chart-dot" cx={x(at)} cy={y(prices[at])} r={4} />
          <text className="chart-axis" x={pad.l} y={H - 6}>
            {age(buckets[0].t)} ago
          </text>
          <text className="chart-axis" x={pad.l + iw} y={H - 6} textAnchor="end">
            now
          </text>
        </svg>
      )}
    </div>
  )
}

// ───────────────── bonding curve

function BondingCurveChart({ c }: { c: CurveView }) {
  const [ref, w] = useWidth()
  const pid = `bc${useId().replace(/[^\w-]/g, '')}`
  const H = 220
  const pad = { l: 8, r: 8, t: 30, b: 24 }
  const iw = Math.max(0, w - pad.l - pad.r)
  const ih = H - pad.t - pad.b

  const st = curveStats(c)
  const s = Number(c.s)
  const sold = Number(c.units_sold)
  const p0 = num(c.p0)
  const p1 = num(c.p1)
  const pNow = num(st.price)
  const tone = c.status === 'TRADING' ? gradStage(st.progress) : 'done'

  const x = (u: number) => pad.l + (s ? u / s : 0) * iw
  const y = (p: number) => pad.t + ih - (p / (p1 * 1.06)) * ih
  const base = y(0)
  const soldArea = `M${x(0)},${base}L${x(0)},${y(p0)}L${x(sold)},${y(pNow)}L${x(sold)},${base}Z`
  const restArea = `M${x(sold)},${base}L${x(sold)},${y(pNow)}L${x(s)},${y(p1)}L${x(s)},${base}Z`
  const nowRight = st.progress > 0.7
  const reserveFits = st.progress > 0.3

  return (
    <div className={`chart bc bc--${tone}`} ref={ref}>
      {w > 0 && (
        <svg width={w} height={H} role="img" aria-label={`Bonding curve: price rises from ${sig(c.p0)} to ${sig(c.p1)}; ${Math.floor(st.progress * 100)}% sold`}>
          <defs>
            <pattern id={pid} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="bc-hatch" />
            </pattern>
          </defs>
          <path d={restArea} fill={`url(#${pid})`} />
          <path className="bc-sold" d={soldArea} />
          {[0.25, 0.5, 0.75].map((k) => (
            <line key={k} className="chart-grid" x1={x(s * k)} x2={x(s * k)} y1={pad.t} y2={base} />
          ))}
          <line className="chart-grid" x1={pad.l} x2={pad.l + iw} y1={base} y2={base} />
          <path className="bc-line" d={`M${x(0)},${y(p0)}L${x(s)},${y(p1)}`} />
          {reserveFits && (
            <text className="bc-reserve" x={x(sold / 2)} y={base - 10} textAnchor="middle">
              {amountShort(c.pool_reserve, CONFIG.payment.decimals)} {CONFIG.payment.symbol} in reserve
            </text>
          )}

          <text className="chart-axis" x={x(0)} y={y(p0) - 10}>
            start {sig(c.p0)}
          </text>
          <text className="chart-axis" x={x(s)} y={y(p1) - 10} textAnchor="end">
            graduation {sig(c.p1)}
          </text>

          {sold > 0 && sold < s && (
            <g>
              <line className="bc-now-line" x1={x(sold)} x2={x(sold)} y1={y(pNow)} y2={base} />
              <circle className="bc-now-ring" cx={x(sold)} cy={y(pNow)} r={9} />
              <circle className="bc-now" cx={x(sold)} cy={y(pNow)} r={4.5} />
              <text className="bc-now-label" x={x(sold) + (nowRight ? -14 : 14)} y={y(pNow) + 4} textAnchor={nowRight ? 'end' : 'start'}>
                now {sig(st.price)}
              </text>
            </g>
          )}

          {[0, 0.25, 0.5, 0.75, 1].map((k) => (
            <text key={k} className="chart-axis" x={x(s * k)} y={H - 6} textAnchor={k === 0 ? 'start' : k === 1 ? 'end' : 'middle'}>
              {k === 0 ? '0' : k === 1 ? 's' : `${k * 100}%`}
            </text>
          ))}
        </svg>
      )}
    </div>
  )
}
