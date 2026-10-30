import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { ChartEmpty, ChartTip, TipRow, fitTicks, XLabels, YGrid, axisDomain, seriesColor, textWidth, useDefaultFormat, useReading, useWidth, xTickIndices } from './shared'

export interface BarChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  data: number[]
  labels?: string[]
  /** Series name for tooltip / summary. */
  name?: string
  height?: number
  /** Positive bars `positive`, negative bars `negative`. Otherwise one series colour. */
  signed?: boolean
  color?: string
  yTicks?: number
  xTicks?: number
  yFormat?: (v: number) => string
  label?: string
}

const PAD_T = 12
const PAD_B = 24
const PAD_R = 12

export function BarChart({
  data,
  labels,
  name,
  height = 200,
  signed,
  color,
  yTicks = 4,
  xTicks = 6,
  yFormat,
  label,
  className,
  ...rest
}: BarChartProps) {
  const { m } = useNuiLocale()
  const [ref, width] = useWidth<HTMLDivElement>()
  const defaultFormat = useDefaultFormat()
  const fmt = yFormat ?? defaultFormat
  const n = data.length
  const { lo, hi, ticks } = axisDomain([0, ...data], yTicks)
  const padL = Math.ceil(Math.max(0, ...ticks.map((t) => textWidth(fmt(t))))) + 12
  const plotW = Math.max(1, width - padL - PAD_R)
  const plotH = Math.max(1, height - PAD_T - PAD_B)
  const band = n ? plotW / n : 0
  const barW = Math.max(1, Math.min(48, band * 0.64))
  const cx_ = (i: number) => padL + band * (i + 0.5)
  const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * plotH
  const reading = useReading(n, (px) => (band ? (px - padL) / band - 0.5 : NaN))
  const idx = reading.index

  if (!n) return <ChartEmpty height={height} className={className} />

  const fill = (v: number) => (signed ? (v >= 0 ? 'var(--nui-positive)' : 'var(--nui-negative)') : (color ?? seriesColor(0)))
  const lbl = (i: number) => labels?.[i] ?? String(i + 1)
  const zero = y(0)
  const tickIdx = xTickIndices(n, fitTicks(xTicks, plotW, Math.max(...data.map((_, i) => textWidth(lbl(i))))))
  const summary = [label, `${name ? name + ': ' : ''}${fmt(Math.min(...data))} – ${fmt(Math.max(...data))}`, `${lbl(0)} – ${lbl(n - 1)}, ${n} bars`]
    .filter(Boolean)
    .join('. ')

  return (
    <div ref={ref} className={cx('nui-chart', className)} tabIndex={0} {...reading.handlers} {...rest}>
      <svg role="img" aria-label={summary || m.chartEmpty} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <YGrid ticks={ticks} y={y} x0={padL} x1={padL + plotW} format={fmt} />
        {data.map((v, i) => {
          const top = Math.min(y(v), zero)
          const h = Math.max(v === 0 ? 0 : 1, Math.abs(y(v) - zero))
          return (
            <rect key={i} className="nui-chart__bar" data-dim={idx != null && idx !== i ? '' : undefined} x={cx_(i) - barW / 2} y={top} width={barW} height={h} fill={fill(v)} />
          )
        })}
        <line className="nui-chart__baseline" x1={padL} x2={padL + plotW} y1={Math.round(zero) + 0.5} y2={Math.round(zero) + 0.5} />
        <XLabels y={height - 6} items={tickIdx.map((i) => ({ x: cx_(i), label: lbl(i) }))} />
      </svg>
      {idx != null ? (
        <ChartTip x={cx_(idx)} width={width} live={reading.live}>
          <div className="nui-chart__tip-head">{lbl(idx)}</div>
          <TipRow color={fill(data[idx])} label={name ?? m.total} value={fmt(data[idx])} />
        </ChartTip>
      ) : null}
    </div>
  )
}
