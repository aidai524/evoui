import type { HTMLAttributes, ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export type UptimeStatus = 'operational' | 'degraded' | 'outage' | 'none'

export interface UptimeDay {
  status: UptimeStatus
  /** Shown in the per-day title, e.g. "2026-10-12". */
  date?: string
}

export interface UptimeBarProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  days: UptimeDay[]
  /** Uptime percentage (0–100). Default: share of known days that were not outages, counting degraded as half. */
  uptime?: number
  /** Optional extra content on the right of the head (e.g. "90 days"). */
  aside?: ReactNode
}

export function UptimeBar({ label, days, uptime, aside, className, ...rest }: UptimeBarProps) {
  const { m, number } = useNuiLocale()
  const known = days.filter((d) => d.status !== 'none')
  const computed = known.length
    ? (known.reduce((s, d) => s + (d.status === 'operational' ? 1 : d.status === 'degraded' ? 0.5 : 0), 0) / known.length) * 100
    : undefined
  const pct = uptime ?? computed
  const pctText = pct == null ? m.noData : `${number(pct, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  const statusText: Record<UptimeStatus, string> = { operational: m.operational, degraded: m.degraded, outage: m.outage, none: m.noData }
  return (
    <div className={cx('nui-uptime', className)} {...rest}>
      <div className="nui-uptime__head">
        <span className="nui-uptime__label">{label}</span>
        <span>
          {aside}
          {aside != null && ' '}
          <strong>{pctText}</strong>
        </span>
      </div>
      <div className="nui-uptime__bar" role="img" aria-label={`${label}: ${pctText}`}>
        {days.map((d, i) => (
          <span key={i} className="nui-uptime__day" data-status={d.status} title={d.date ? `${d.date} · ${statusText[d.status]}` : statusText[d.status]} />
        ))}
      </div>
    </div>
  )
}
