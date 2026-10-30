import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export type ProbabilityTone = 'positive' | 'negative' | 'accent' | 'info' | 'neutral'

export interface ProbabilityOutcome {
  label: string
  /** 0–1. */
  probability: number
  /** Default: chart-1…chart-5 in order. */
  tone?: ProbabilityTone
}

export interface ProbabilityBarProps extends HTMLAttributes<HTMLDivElement> {
  outcomes: ProbabilityOutcome[]
  /** Show the legend row (default true). */
  legend?: boolean
}

const TONE: Record<ProbabilityTone, string> = {
  positive: 'var(--nui-positive)',
  negative: 'var(--nui-negative)',
  accent: 'var(--nui-accent)',
  info: 'var(--nui-info)',
  neutral: 'var(--nui-text-muted)',
}

export function ProbabilityBar({ outcomes, legend = true, className, ...rest }: ProbabilityBarProps) {
  const { number } = useNuiLocale()
  const total = outcomes.reduce((s, o) => s + Math.max(0, o.probability), 0) || 1
  const items = outcomes.map((o, i) => ({
    ...o,
    share: Math.max(0, o.probability) / total,
    color: o.tone ? TONE[o.tone] : `var(--nui-chart-${(i % 5) + 1})`,
    text: `${number(Math.round(Math.max(0, o.probability) * 100))}%`,
  }))
  const summary = items.map((o) => `${o.label} ${o.text}`).join(', ')
  return (
    <div className={cx('nui-probbar', className)} {...rest}>
      <div className="nui-probbar__track" role="img" aria-label={summary}>
        {items.map((o, i) =>
          o.share > 0 ? <span key={i} className="nui-probbar__seg" style={{ flexGrow: o.share, background: o.color }} /> : null,
        )}
      </div>
      {legend && (
        <ul className="nui-probbar__legend" aria-hidden="true">
          {items.map((o, i) => (
            <li key={i}>
              <span className="nui-probbar__swatch" style={{ background: o.color }} />
              {o.label} <strong>{o.text}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
