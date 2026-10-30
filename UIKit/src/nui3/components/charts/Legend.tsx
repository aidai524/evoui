import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { seriesColor } from './shared'

export interface LegendItem {
  label: ReactNode
  /** Any CSS colour token, e.g. `var(--nui-chart-2)`. Defaults to chart-1..5 by position. */
  color?: string
  value?: ReactNode
  /** Render the swatch as a dashed rule (matches a dashed series). */
  dashed?: boolean
}

export interface LegendProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  items: LegendItem[]
  /** 'row' (default) wraps horizontally; 'column' stacks (DonutChart). */
  direction?: 'row' | 'column'
}

/** Reusable chart legend: 8×8 swatch + label (+ tabular value). */
export function Legend({ items, direction = 'row', className, ...rest }: LegendProps) {
  return (
    <ul className={cx('nui-chart__legend', className)} data-direction={direction} {...rest}>
      {items.map((it, i) => (
        <li key={i} className="nui-chart__legend-item">
          <span
            className="nui-chart__swatch"
            data-dashed={it.dashed || undefined}
            style={it.dashed ? { color: it.color ?? seriesColor(i) } : { background: it.color ?? seriesColor(i) }}
            aria-hidden="true"
          />
          <span className="nui-chart__legend-label">{it.label}</span>
          {it.value != null ? <span className="nui-chart__legend-value">{it.value}</span> : null}
        </li>
      ))}
    </ul>
  )
}
