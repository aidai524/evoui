import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { Legend } from './Legend'
import { ChartEmpty, ChartTip, TipRow, fitTicks, XLabels, YGrid, axisDomain, seriesColor, textWidth, useDefaultFormat, useReading, useSvgId, useWidth, xTickIndices } from './shared'

export interface LineSeries {
  name: string
  data: number[]
  /** CSS colour; defaults to chart-1..5 by series order. */
  color?: string
  /** Same-colour vertical gradient fill down to the baseline. */
  area?: boolean
  /** 4 4 dash (forecast, target, comparison). */
  dashed?: boolean
}

export interface ChartReferenceY {
  value: number
  label?: string
}

export interface ChartReferenceX {
  /** Data index the vertical rule sits on. */
  index: number
  label?: string
}

export interface ChartMarker {
  index: number
  /** Series index (default 0). */
  series?: number
  label?: string
}

export interface LineChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  series: LineSeries[]
  /** X labels, one per data index. */
  labels?: string[]
  height?: number
  yTicks?: number
  xTicks?: number
  yFormat?: (v: number) => string
  referenceY?: ChartReferenceY[]
  referenceX?: ChartReferenceX[]
  markers?: ChartMarker[]
  curve?: 'linear' | 'step'
  /** Show a legend under the plot (default: when there are 2+ series). */
  legend?: boolean
  yMin?: number
  yMax?: number
  /** Accessible name prefix for the summary, e.g. "ZEC price, 30 days". */
  label?: string
}

const PAD_T = 12
const PAD_B = 24
const PAD_R = 12

function linePath(pts: ([number, number] | null)[], curve: 'linear' | 'step') {
  let d = ''
  let prev: [number, number] | null = null
  for (const p of pts) {
    if (!p) {
      prev = null
      continue
    }
    if (!prev) d += `M${p[0].toFixed(2)} ${p[1].toFixed(2)}`
    else if (curve === 'step') d += `H${p[0].toFixed(2)}V${p[1].toFixed(2)}`
    else d += `L${p[0].toFixed(2)} ${p[1].toFixed(2)}`
    prev = p
  }
  return d
}

export function LineChart({
  series,
  labels,
  height = 240,
  yTicks = 4,
  xTicks = 5,
  yFormat,
  referenceY = [],
  referenceX = [],
  markers = [],
  curve = 'linear',
  legend,
  yMin,
  yMax,
  label,
  className,
  ...rest
}: LineChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const gid = useSvgId('nui-line')
  const { m } = useNuiLocale()
  const defaultFormat = useDefaultFormat()
  const fmt = yFormat ?? defaultFormat
  const n = Math.max(0, ...series.map((s) => s.data.length))

  const all = series.flatMap((s) => s.data)
  const { lo, hi, ticks } = axisDomain([...all, ...referenceY.map((r) => r.value)], yTicks, yMin, yMax)
  const padL = Math.ceil(Math.max(0, ...ticks.map((t) => textWidth(fmt(t))))) + 12
  const plotW = Math.max(1, width - padL - PAD_R)
  const plotH = Math.max(1, height - PAD_T - PAD_B)
  const step = n > 1 ? plotW / (n - 1) : 0
  const x = (i: number) => padL + i * step
  const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * plotH
  const base = PAD_T + plotH

  const reading = useReading(n >= 2 ? n : 0, (px) => (step ? (px - padL) / step : NaN))
  const idx = reading.index

  if (n === 0) return <ChartEmpty height={height} className={className} />

  const color = (i: number) => series[i]?.color ?? seriesColor(i)
  const lbl = (i: number) => labels?.[i] ?? String(i + 1)
  const finite = all.filter(Number.isFinite)
  const summary = [
    label,
    series.map((s) => {
      const v = s.data.filter(Number.isFinite)
      return v.length ? `${s.name}: ${fmt(Math.min(...v))} – ${fmt(Math.max(...v))}` : s.name
    }).join('; '),
    n > 1 ? `${lbl(0)} – ${lbl(n - 1)}, ${n} points` : null,
  ]
    .filter(Boolean)
    .join('. ')

  const xTickIdx = xTickIndices(n, fitTicks(xTicks, plotW, Math.max(...Array.from({ length: n }, (_, i) => textWidth(lbl(i))))))
  const showLegend = legend ?? series.length > 1

  return (
    <div ref={ref} className={cx('nui-chart', className)} tabIndex={0} {...reading.handlers} {...rest}>
      <svg role="img" aria-label={n >= 2 && finite.length ? summary : [label, m.chartEmpty].filter(Boolean).join('. ')} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {series.map((s, i) =>
            s.area ? (
              <linearGradient key={i} id={`${gid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color(i)} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color(i)} stopOpacity={0} />
              </linearGradient>
            ) : null,
          )}
        </defs>
        <YGrid ticks={ticks} y={y} x0={padL} x1={padL + plotW} format={fmt} />
        <XLabels
          y={height - 6}
          items={xTickIdx.map((i, k) => ({ x: x(i), label: lbl(i), edge: n > 1 && k === 0 ? 'start' : n > 1 && k === xTickIdx.length - 1 ? 'end' : undefined }))}
        />
        {n >= 2
          ? series.map((s, i) => {
              const pts = s.data.map((v, j) => (Number.isFinite(v) ? ([x(j), y(v)] as [number, number]) : null))
              const d = linePath(pts, curve)
              const valid = pts.filter((p): p is [number, number] => p != null)
              return (
                <g key={i}>
                  {s.area && valid.length > 1 ? (
                    <path d={`${linePath(valid, curve)}L${valid[valid.length - 1][0].toFixed(2)} ${base}L${valid[0][0].toFixed(2)} ${base}Z`} fill={`url(#${gid}-${i})`} stroke="none" />
                  ) : null}
                  <path className="nui-chart__line" d={d} stroke={color(i)} strokeDasharray={s.dashed ? '4 4' : undefined} />
                </g>
              )
            })
          : null}
        {referenceY.map((r, i) => {
          const yy = Math.round(y(r.value)) + 0.5
          return (
            <g key={`ry${i}`}>
              <line className="nui-chart__ref" x1={padL} x2={padL + plotW} y1={yy} y2={yy} />
              {r.label ? (
                <text className="nui-chart__ref-label" x={padL + plotW} y={yy - 5} textAnchor="end">
                  {r.label}
                </text>
              ) : null}
            </g>
          )
        })}
        {referenceX.map((r, i) => {
          const xx = Math.round(x(r.index)) + 0.5
          return (
            <g key={`rx${i}`}>
              <line className="nui-chart__ref" x1={xx} x2={xx} y1={PAD_T} y2={base} />
              {r.label ? (
                <text className="nui-chart__ref-label" x={xx + 5} y={PAD_T + 9}>
                  {r.label}
                </text>
              ) : null}
            </g>
          )
        })}
        {n >= 2
          ? markers.map((mk, i) => {
              const s = mk.series ?? 0
              const v = series[s]?.data[mk.index]
              if (v == null || !Number.isFinite(v)) return null
              return (
                <g key={`m${i}`}>
                  <circle className="nui-chart__marker" cx={x(mk.index)} cy={y(v)} r={4.5} stroke={color(s)} />
                  {mk.label ? (
                    <text className="nui-chart__ref-label" x={x(mk.index)} y={y(v) - 10} textAnchor="middle">
                      {mk.label}
                    </text>
                  ) : null}
                </g>
              )
            })
          : null}
        {idx != null ? (
          <g aria-hidden="true">
            <line className="nui-chart__crosshair" x1={Math.round(x(idx)) + 0.5} x2={Math.round(x(idx)) + 0.5} y1={PAD_T} y2={base} />
            {series.map((s, i) =>
              Number.isFinite(s.data[idx]) ? <circle key={i} className="nui-chart__dot" cx={x(idx)} cy={y(s.data[idx])} r={3.5} stroke={color(i)} /> : null,
            )}
          </g>
        ) : null}
      </svg>
      {idx != null ? (
        <ChartTip x={x(idx)} width={width} live={reading.live}>
          <div className="nui-chart__tip-head">{lbl(idx)}</div>
          {series.map((s, i) => (
            <TipRow key={i} color={color(i)} label={s.name} value={Number.isFinite(s.data[idx]) ? fmt(s.data[idx]) : '—'} />
          ))}
        </ChartTip>
      ) : null}
      {showLegend ? <Legend items={series.map((s, i) => ({ label: s.name, color: color(i), dashed: s.dashed }))} /> : null}
    </div>
  )
}
