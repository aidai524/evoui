import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { niceTicks } from '../../utils/misc'
import { ChartEmpty, ChartTip, TipRow, XLabels, YGrid, axisDomain, clamp, textWidth, useDefaultFormat, useReading, useSvgId, useWidth } from './shared'

export interface BondingCurveProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Price at a given supply. */
  price: (supply: number) => number
  maxSupply: number
  /** Supply sold so far (filled part + marker). */
  sold: number
  /** Marker label, e.g. "Now". */
  nowLabel?: string
  height?: number
  /** Sample count along the curve (default 60). */
  samples?: number
  /** Price formatter (injected). */
  format?: (v: number) => string
  supplyFormat?: (v: number) => string
  yTicks?: number
  xTicks?: number
  color?: string
  label?: string
}

const PAD_T = 16
const PAD_B = 24
const PAD_R = 16

export function BondingCurve({
  price,
  maxSupply,
  sold,
  nowLabel,
  height = 240,
  samples = 60,
  format,
  supplyFormat,
  yTicks = 4,
  xTicks = 5,
  color = 'var(--nui-chart-1)',
  label,
  className,
  ...rest
}: BondingCurveProps) {
  const { m, t, number } = useNuiLocale()
  const [ref, width] = useWidth<HTMLDivElement>()
  const gid = useSvgId('nui-bond')
  const defaultFormat = useDefaultFormat()
  const fmt = format ?? defaultFormat
  const sfmt = supplyFormat ?? ((v: number) => number(v, { notation: 'compact', maximumFractionDigits: 1 }))
  const ok = Number.isFinite(maxSupply) && maxSupply > 0 && samples >= 2
  const n = ok ? Math.round(samples) : 0
  const supplyAt = (i: number) => (maxSupply * i) / (n - 1)
  const pts = Array.from({ length: n }, (_, i) => {
    const s = supplyAt(i)
    return { s, p: price(s) }
  }).filter((d) => Number.isFinite(d.p))
  const soldC = clamp(sold, 0, ok ? maxSupply : 0)
  const { lo, hi, ticks } = axisDomain([0, ...pts.map((d) => d.p)], yTicks, 0)
  const padL = Math.ceil(Math.max(0, ...ticks.map((v) => textWidth(fmt(v))))) + 12
  const plotW = Math.max(1, width - padL - PAD_R)
  const plotH = Math.max(1, height - PAD_T - PAD_B)
  const x = (s: number) => padL + (s / (ok ? maxSupply : 1)) * plotW
  const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * plotH
  const base = PAD_T + plotH
  const reading = useReading(pts.length, (px) => ((px - padL) / plotW) * (pts.length - 1))

  if (pts.length < 2) return <ChartEmpty height={height} className={className} />
  const idx = reading.index
  const P = (d: { s: number; p: number }) => `${x(d.s).toFixed(2)} ${y(d.p).toFixed(2)}`
  const full = 'M' + pts.map(P).join('L')
  const soldPts = [...pts.filter((d) => d.s < soldC), { s: soldC, p: price(soldC) }]
  const soldLine = 'M' + soldPts.map(P).join('L')
  const soldArea = `${soldLine}L${x(soldC).toFixed(2)} ${base}L${x(0).toFixed(2)} ${base}Z`
  const nowP = price(soldC)
  const xt = niceTicks(0, maxSupply, xTicks).filter((v) => v >= 0 && v <= maxSupply)
  const supplyWord = t('Supply', '供应量')
  const rd = idx != null ? pts[idx] : null
  const summary = [
    label,
    `${m.price} ${fmt(pts[0].p)} – ${fmt(pts[pts.length - 1].p)} over ${supplyWord.toLowerCase()} 0 – ${sfmt(maxSupply)}`,
    `${nowLabel ?? t('Now', '当前')}: ${sfmt(soldC)} (${number(soldC / maxSupply, { style: 'percent', maximumFractionDigits: 1 })}), ${m.price} ${fmt(nowP)}`,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <div ref={ref} className={cx('nui-chart', className)} tabIndex={0} {...reading.handlers} {...rest}>
      <svg role="img" aria-label={summary} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.06} />
          </linearGradient>
        </defs>
        <YGrid ticks={ticks} y={y} x0={padL} x1={padL + plotW} format={fmt} />
        <path d={soldArea} fill={`url(#${gid})`} stroke="none" />
        <path className="nui-chart__line" d={full} stroke={color} strokeDasharray="4 4" strokeOpacity={0.7} />
        <path className="nui-chart__line" d={soldLine} stroke={color} />
        <line className="nui-chart__ref" x1={Math.round(x(soldC)) + 0.5} x2={Math.round(x(soldC)) + 0.5} y1={y(nowP)} y2={base} />
        <circle className="nui-chart__marker" cx={x(soldC)} cy={y(nowP)} r={4.5} stroke={color} />
        {nowLabel ? (
          <text className="nui-chart__ref-label" x={x(soldC)} y={y(nowP) - 11} textAnchor={x(soldC) > padL + plotW - 40 ? 'end' : x(soldC) < padL + 40 ? 'start' : 'middle'}>
            {nowLabel}
          </text>
        ) : null}
        {rd ? (
          <g aria-hidden="true">
            <line className="nui-chart__crosshair" x1={Math.round(x(rd.s)) + 0.5} x2={Math.round(x(rd.s)) + 0.5} y1={PAD_T} y2={base} />
            <circle className="nui-chart__dot" cx={x(rd.s)} cy={y(rd.p)} r={3.5} stroke={color} />
          </g>
        ) : null}
        <XLabels y={height - 6} items={xt.map((v, k) => ({ x: x(v), label: sfmt(v), edge: k === 0 ? 'start' : k === xt.length - 1 && v === maxSupply ? 'end' : undefined }))} />
      </svg>
      {rd ? (
        <ChartTip x={x(rd.s)} width={width} live={reading.live}>
          <TipRow label={supplyWord} value={sfmt(rd.s)} />
          <TipRow color={color} label={m.price} value={fmt(rd.p)} />
        </ChartTip>
      ) : null}
    </div>
  )
}

export type BondingCurveChartProps = BondingCurveProps

/** LaunchPad-named alias of BondingCurve (identical behaviour). */
export function BondingCurveChart(props: BondingCurveChartProps) {
  return <BondingCurve {...props} />
}
