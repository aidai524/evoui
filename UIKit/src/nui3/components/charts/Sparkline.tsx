import type { SVGAttributes } from 'react'
import { cx } from '../../utils/cx'

export interface SparklineProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  data: number[]
  width?: number
  height?: number
  /** 'auto' colours by first → last direction. */
  tone?: 'auto' | 'neutral' | 'positive' | 'negative'
  /** Accessible summary. Without it the sparkline is decorative (aria-hidden). */
  label?: string
}

const TONE = { neutral: 'var(--nui-text-secondary)', positive: 'var(--nui-positive)', negative: 'var(--nui-negative)' }

/** 96×28 inline trend line, no axes. */
export function Sparkline({ data, width = 96, height = 28, tone = 'auto', label, className, ...rest }: SparklineProps) {
  const v = data.filter(Number.isFinite)
  const resolved = tone === 'auto' ? (v.length < 2 || v[v.length - 1] === v[0] ? 'neutral' : v[v.length - 1] > v[0] ? 'positive' : 'negative') : tone
  const lo = Math.min(...v)
  const hi = Math.max(...v)
  const pad = 2
  const d =
    v.length < 2
      ? ''
      : v
          .map((p, i) => {
            const x = pad + (i * (width - pad * 2)) / (v.length - 1)
            const y = hi === lo ? height / 2 : pad + (1 - (p - lo) / (hi - lo)) * (height - pad * 2)
            return `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`
          })
          .join('')
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const, focusable: 'false' as const }
  return (
    <svg className={cx('nui-sparkline', className)} data-tone={resolved} width={width} height={height} viewBox={`0 0 ${width} ${height}`} {...a11y} {...rest}>
      {d ? <path d={d} fill="none" stroke={TONE[resolved]} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" /> : null}
    </svg>
  )
}
