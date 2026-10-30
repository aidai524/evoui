import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { niceTicks } from '../../utils/misc'
import { ChartEmpty, ChartTip, TipRow, XLabels, YGrid, axisDomain, textWidth, useDefaultFormat, useReading, useWidth } from './shared'

export interface DepthLevel {
  price: number
  size: number
}

export interface DepthChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  bids: DepthLevel[]
  asks: DepthLevel[]
  height?: number
  /** Price formatter (injected). */
  format?: (v: number) => string
  /** Cumulative size formatter. */
  sizeFormat?: (v: number) => string
  yTicks?: number
  xTicks?: number
  label?: string
}

const PAD_T = 12
const PAD_B = 24
const PAD_R = 12

interface Lvl {
  price: number
  cum: number
  side: 'bid' | 'ask'
}

function cumulative(levels: DepthLevel[], side: 'bid' | 'ask'): Lvl[] {
  const sorted = [...levels].filter((l) => l.size > 0).sort((a, b) => (side === 'bid' ? b.price - a.price : a.price - b.price))
  let acc = 0
  return sorted.map((l) => ({ price: l.price, cum: (acc += l.size), side }))
}

export function DepthChart({ bids, asks, height = 200, format, sizeFormat, yTicks = 4, xTicks = 5, label, className, ...rest }: DepthChartProps) {
  const { m, number } = useNuiLocale()
  const [ref, width] = useWidth<HTMLDivElement>()
  const defaultFormat = useDefaultFormat()
  const fmt = format ?? ((v: number) => number(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  const sfmt = sizeFormat ?? defaultFormat
  const b = cumulative(bids, 'bid')
  const a = cumulative(asks, 'ask')
  const levels = [...[...b].reverse(), ...a]
  const prices = levels.map((l) => l.price)
  const pLo = Math.min(...prices)
  const pHi = Math.max(...prices)
  const { lo, hi, ticks } = axisDomain([0, ...levels.map((l) => l.cum)], yTicks, 0)
  const padL = Math.ceil(Math.max(0, ...ticks.map((t) => textWidth(sfmt(t))))) + 12
  const plotW = Math.max(1, width - padL - PAD_R)
  const plotH = Math.max(1, height - PAD_T - PAD_B)
  const x = (p: number) => padL + (pHi === pLo ? 0.5 : (p - pLo) / (pHi - pLo)) * plotW
  const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * plotH
  const base = PAD_T + plotH

  const reading = useReading(levels.length, (px) => {
    const p = pLo + ((px - padL) / plotW) * (pHi - pLo)
    let best = 0
    for (let i = 1; i < prices.length; i++) if (Math.abs(prices[i] - p) < Math.abs(prices[best] - p)) best = i
    return best
  })
  if (!levels.length) return <ChartEmpty height={height} className={className} />
  const idx = reading.index

  const stepPath = (side: Lvl[], edge: number) => {
    if (!side.length) return { line: '', area: '' }
    let line = `M${x(side[0].price).toFixed(2)} ${base}V${y(side[0].cum).toFixed(2)}`
    for (let i = 1; i < side.length; i++) line += `H${x(side[i].price).toFixed(2)}V${y(side[i].cum).toFixed(2)}`
    line += `H${x(edge).toFixed(2)}`
    return { line, area: `${line}V${base}H${x(side[0].price).toFixed(2)}Z` }
  }
  const bp = stepPath(b, pLo)
  const ap = stepPath(a, pHi)
  const bestBid = b[0]?.price
  const bestAsk = a[0]?.price
  const mid = bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null
  const xt = niceTicks(pLo, pHi, xTicks).filter((t) => t >= pLo && t <= pHi)
  const lv = idx != null ? levels[idx] : null
  const summary = [
    label,
    `${m.bids} ${b.length ? `${fmt(b[b.length - 1].price)} – ${fmt(b[0].price)}` : '—'}`,
    `${m.asks} ${a.length ? `${fmt(a[0].price)} – ${fmt(a[a.length - 1].price)}` : '—'}`,
    `${m.total} ${sfmt(Math.max(...levels.map((l) => l.cum)))}`,
    bestBid != null && bestAsk != null ? `${m.spread} ${fmt(bestAsk - bestBid)}` : null,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <div ref={ref} className={cx('nui-chart', className)} tabIndex={0} {...reading.handlers} {...rest}>
      <svg role="img" aria-label={summary} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <YGrid ticks={ticks} y={y} x0={padL} x1={padL + plotW} format={sfmt} />
        {bp.area ? <path d={bp.area} fill="var(--nui-positive)" fillOpacity={0.14} stroke="none" /> : null}
        {ap.area ? <path d={ap.area} fill="var(--nui-negative)" fillOpacity={0.14} stroke="none" /> : null}
        {bp.line ? <path className="nui-chart__line" d={bp.line} stroke="var(--nui-positive)" strokeWidth={1.5} strokeLinejoin="miter" /> : null}
        {ap.line ? <path className="nui-chart__line" d={ap.line} stroke="var(--nui-negative)" strokeWidth={1.5} strokeLinejoin="miter" /> : null}
        {mid != null ? (
          <g>
            <line className="nui-chart__ref" x1={Math.round(x(mid)) + 0.5} x2={Math.round(x(mid)) + 0.5} y1={PAD_T} y2={base} />
            <text className="nui-chart__ref-label" x={x(mid)} y={PAD_T + 9} textAnchor="middle">
              {fmt(mid)}
            </text>
          </g>
        ) : null}
        {lv ? (
          <g aria-hidden="true">
            <line className="nui-chart__crosshair" x1={Math.round(x(lv.price)) + 0.5} x2={Math.round(x(lv.price)) + 0.5} y1={PAD_T} y2={base} />
            <circle className="nui-chart__dot" cx={x(lv.price)} cy={y(lv.cum)} r={3.5} stroke={lv.side === 'bid' ? 'var(--nui-positive)' : 'var(--nui-negative)'} />
          </g>
        ) : null}
        <XLabels y={height - 6} items={xt.map((t) => ({ x: x(t), label: fmt(t) }))} />
      </svg>
      {lv ? (
        <ChartTip x={x(lv.price)} width={width} live={reading.live}>
          <div className="nui-chart__tip-head">{lv.side === 'bid' ? m.bids : m.asks}</div>
          <TipRow label={m.price} value={fmt(lv.price)} />
          <TipRow color={lv.side === 'bid' ? 'var(--nui-positive)' : 'var(--nui-negative)'} label={m.total} value={sfmt(lv.cum)} />
        </ChartTip>
      ) : null}
    </div>
  )
}
