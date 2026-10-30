import type { HTMLAttributes, ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { Legend } from './Legend'
import { ChartEmpty, seriesColor, useDefaultFormat, useReading } from './shared'

export interface DonutDatum {
  label: string
  value: number
  color?: string
}

export interface DonutChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  data: DonutDatum[]
  size?: number
  thickness?: number
  /** Centre content (tabular), e.g. a total. Replaced by the active segment while reading. */
  center?: ReactNode
  /** Vertical legend beside the ring (default true). */
  legend?: boolean
  format?: (v: number) => string
  label?: string
}

export function DonutChart({ data, size = 168, thickness = 18, center, legend = true, format, label, className, style, ...rest }: DonutChartProps) {
  const { number } = useNuiLocale()
  const defaultFormat = useDefaultFormat()
  const fmt = format ?? defaultFormat
  const items = data.filter((d) => Number.isFinite(d.value) && d.value > 0)
  const total = items.reduce((a, d) => a + d.value, 0)
  const reading = useReading(items.length)
  if (!items.length || total <= 0) return <ChartEmpty height={size} className={className} style={style} />

  const idx = reading.index
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const gap = items.length > 1 ? 2 : 0
  const pct = (v: number) => number(v / total, { style: 'percent', maximumFractionDigits: 1 })
  const color = (d: DonutDatum, i: number) => d.color ?? seriesColor(i)
  let acc = 0
  const summary = [label, `${fmt(total)} total`, items.map((d) => `${d.label} ${fmt(d.value)} (${pct(d.value)})`).join(', ')].filter(Boolean).join('. ')

  return (
    <div className={cx('nui-chart', 'nui-chart--donut', className)} tabIndex={0} {...reading.handlers} onPointerMove={undefined} style={style} {...rest}>
      <div className="nui-chart__ring" style={{ width: size, height: size }}>
        <svg role="img" aria-label={summary} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--nui-chart-grid)" strokeWidth={thickness} />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {items.map((d, i) => {
              const len = (d.value / total) * c
              const off = acc
              acc += len
              return (
                <circle
                  key={i}
                  className="nui-chart__segment"
                  data-dim={idx != null && idx !== i ? '' : undefined}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={color(d, i)}
                  strokeWidth={thickness}
                  strokeDasharray={`${Math.max(0.5, len - gap)} ${c}`}
                  strokeDashoffset={-off}
                  onPointerEnter={() => reading.setIndex(i)}
                />
              )
            })}
          </g>
        </svg>
        <div className="nui-chart__center" aria-live={idx != null && reading.live ? 'polite' : 'off'}>
          {idx != null ? (
            <>
              <span className="nui-chart__center-label">{items[idx].label}</span>
              <span className="nui-chart__center-value">{pct(items[idx].value)}</span>
              <span className="nui-chart__center-label">{fmt(items[idx].value)}</span>
            </>
          ) : (
            center
          )}
        </div>
      </div>
      {legend ? <Legend direction="column" items={items.map((d, i) => ({ label: d.label, color: color(d, i), value: pct(d.value) }))} /> : null}
    </div>
  )
}
