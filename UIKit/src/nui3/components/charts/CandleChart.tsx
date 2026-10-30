import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { ChartEmpty, fitTicks, XLabels, YGrid, axisDomain, textWidth, useReading, useWidth, xTickIndices } from './shared'

export interface CandleDatum {
  /** Timestamp (ms) or label. */
  t: number | string | Date
  o: number
  h: number
  l: number
  c: number
  v?: number
}

export interface CandleChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  data: CandleDatum[]
  height?: number
  /** Show the volume pane (16% of the plot height). Default: when any candle has `v`. */
  volume?: boolean
  yTicks?: number
  xTicks?: number
  /** Price formatter (injected). */
  format?: (v: number) => string
  volumeFormat?: (v: number) => string
  timeFormat?: (t: number | string | Date) => string
  label?: string
}

const PAD_T = 12
const PAD_B = 24
const PAD_L = 8

export function CandleChart({
  data,
  height = 320,
  volume,
  yTicks = 4,
  xTicks = 5,
  format,
  volumeFormat,
  timeFormat,
  label,
  className,
  ...rest
}: CandleChartProps) {
  const { m, number, locale } = useNuiLocale()
  const [ref, width] = useWidth<HTMLDivElement>()
  const n = data.length
  const fmt = format ?? ((v: number) => number(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  const vfmt = volumeFormat ?? ((v: number) => number(v, { notation: 'compact', maximumFractionDigits: 1 }))
  const ms = data.map((d) => (typeof d.t === 'string' ? NaN : +d.t))
  const span = n > 1 ? ms[n - 1] - ms[0] : 0
  const tf =
    timeFormat ??
    ((t: number | string | Date) => {
      if (typeof t === 'string') return t
      const d = new Date(t)
      return span > 2 * 86_400_000
        ? d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
        : d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
    })

  const full = (t: number | string | Date) =>
    typeof t === 'string' ? t : new Date(t).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  const { lo, hi, ticks } = axisDomain([...data.map((d) => d.l), ...data.map((d) => d.h)], yTicks)
  const padR = Math.ceil(Math.max(0, ...ticks.map((t) => textWidth(fmt(t))), n ? textWidth(fmt(data[n - 1].c)) + 8 : 0)) + 16
  const plotW = Math.max(1, width - PAD_L - padR)
  const plotH = Math.max(1, height - PAD_T - PAD_B)
  const showVol = volume ?? data.some((d) => d.v != null)
  const volH = showVol ? plotH * 0.16 : 0
  const priceH = plotH - (showVol ? volH + 8 : 0)
  const band = n ? plotW / n : 0
  const bodyW = Math.max(1, Math.min(14, band * 0.62))
  const cxi = (i: number) => PAD_L + band * (i + 0.5)
  const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * priceH
  const maxV = Math.max(1, ...data.map((d) => d.v ?? 0))
  const volBase = PAD_T + plotH

  const reading = useReading(n, (px) => (band ? (px - PAD_L) / band - 0.5 : NaN))
  if (!n) return <ChartEmpty height={height} className={className} />

  const idx = reading.index
  const cur = data[idx ?? n - 1]
  const up = (d: CandleDatum) => d.c >= d.o
  const tone = (d: CandleDatum) => (up(d) ? 'var(--nui-positive)' : 'var(--nui-negative)')
  const last = data[n - 1]
  const lastY = y(last.c)
  const tickIdx = xTickIndices(n, fitTicks(xTicks, plotW, Math.max(...data.map((d) => textWidth(tf(d.t))))))
  const summary = [
    label,
    `${n} candles, ${full(data[0].t)} – ${full(last.t)}`,
    `${m.price} ${fmt(Math.min(...data.map((d) => d.l)))} – ${fmt(Math.max(...data.map((d) => d.h)))}`,
    `${m.lastPrice} ${fmt(last.c)}`,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <div ref={ref} className={cx('nui-chart', className)} tabIndex={0} {...reading.handlers} {...rest}>
      <div className="nui-chart__ohlc" aria-live={idx != null && reading.live ? 'polite' : 'off'}>
        <span className="nui-chart__ohlc-time">{tf(cur.t)}</span>
        {(
          [
            ['O', fmt(cur.o)],
            ['H', fmt(cur.h)],
            ['L', fmt(cur.l)],
            ['C', fmt(cur.c)],
          ] as const
        ).map(([k, v]) => (
          <span key={k}>
            <span className="nui-chart__ohlc-key">{k}</span>{' '}
            <span className="nui-chart__ohlc-value" data-dir={k === 'C' ? (up(cur) ? 'up' : 'down') : undefined}>
              {v}
            </span>
          </span>
        ))}
        {cur.v != null ? (
          <span>
            <span className="nui-chart__ohlc-key">V</span> <span className="nui-chart__ohlc-value">{vfmt(cur.v)}</span>
          </span>
        ) : null}
      </div>
      <svg role="img" aria-label={summary} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <YGrid ticks={ticks} y={y} x0={PAD_L} x1={PAD_L + plotW} format={fmt} side="right" />
        {showVol ? (
          <line className="nui-chart__grid" x1={PAD_L} x2={PAD_L + plotW} y1={Math.round(volBase - volH) - 4 + 0.5} y2={Math.round(volBase - volH) - 4 + 0.5} />
        ) : null}
        {data.map((d, i) => {
          const x = cxi(i)
          const top = y(Math.max(d.o, d.c))
          const bh = Math.max(1, Math.abs(y(d.o) - y(d.c)))
          const vh = showVol && d.v ? Math.max(1, (d.v / maxV) * volH) : 0
          return (
            <g key={i} data-dim={idx != null && idx !== i ? '' : undefined} className="nui-chart__candle">
              {vh ? <rect x={x - bodyW / 2} y={volBase - vh} width={bodyW} height={vh} fill={tone(d)} fillOpacity={0.28} /> : null}
              <line x1={Math.round(x) + 0.5} x2={Math.round(x) + 0.5} y1={y(d.h)} y2={y(d.l)} stroke={tone(d)} strokeWidth={1} />
              <rect x={x - bodyW / 2} y={top} width={bodyW} height={bh} fill={tone(d)} />
            </g>
          )
        })}
        <line className="nui-chart__ref" x1={PAD_L} x2={PAD_L + plotW} y1={Math.round(lastY) + 0.5} y2={Math.round(lastY) + 0.5} />
        {idx != null ? (
          <g aria-hidden="true">
            <line className="nui-chart__crosshair" x1={Math.round(cxi(idx)) + 0.5} x2={Math.round(cxi(idx)) + 0.5} y1={PAD_T} y2={volBase} />
            <line className="nui-chart__crosshair" x1={PAD_L} x2={PAD_L + plotW} y1={Math.round(y(cur.c)) + 0.5} y2={Math.round(y(cur.c)) + 0.5} />
          </g>
        ) : null}
        <g className="nui-chart__last">
          <rect x={PAD_L + plotW + 4} y={lastY - 9} width={padR - 6} height={18} />
          <text x={PAD_L + plotW + 8} y={lastY} dy="0.32em">
            {fmt(last.c)}
          </text>
        </g>
        <XLabels y={height - 6} items={tickIdx.map((i, k) => ({ x: cxi(i), label: tf(data[i].t), edge: k === 0 ? 'start' : k === tickIdx.length - 1 ? 'end' : undefined }))} />
      </svg>
    </div>
  )
}
