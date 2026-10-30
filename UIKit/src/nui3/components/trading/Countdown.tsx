import { useEffect, useState, type HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export interface CountdownProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Target time. */
  to: Date | number | string
  /** Drop leading zero units and show at most three (default true). */
  compact?: boolean
  onEnd?: () => void
}

type Part = { n: number; unit: 'days' | 'hours' | 'minutes' | 'seconds' }

function parts(ms: number): Part[] {
  const s = Math.max(0, Math.floor(ms / 1000))
  return [
    { n: Math.floor(s / 86400), unit: 'days' },
    { n: Math.floor((s % 86400) / 3600), unit: 'hours' },
    { n: Math.floor((s % 3600) / 60), unit: 'minutes' },
    { n: s % 60, unit: 'seconds' },
  ]
}

export function Countdown({ to, compact = true, onEnd, className, ...rest }: CountdownProps) {
  const { m } = useNuiLocale()
  const target = new Date(to).getTime()
  const [now, setNow] = useState(() => Date.now())
  const left = target - now
  useEffect(() => {
    if (left <= 0) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [left <= 0]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (left <= 0) onEnd?.()
  }, [left <= 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const iso = Number.isFinite(target) ? new Date(target).toISOString() : undefined
  if (left <= 0) {
    return (
      <time className={cx('nui-countdown', className)} dateTime={iso} data-ended="" {...rest}>
        {m.ended}
      </time>
    )
  }
  let list = parts(left)
  if (compact) {
    const first = list.findIndex((p) => p.n > 0)
    list = list.slice(first === -1 ? 3 : first, (first === -1 ? 3 : first) + 3)
  }
  return (
    <time className={cx('nui-countdown', className)} dateTime={iso} {...rest}>
      {list.map((p, i) => (
        <span key={p.unit} className="nui-countdown__part">
          <span className="nui-countdown__num">{!compact || i > 0 ? String(p.n).padStart(2, '0') : p.n}</span>
          <span className="nui-countdown__unit">{m[p.unit]}</span>
        </span>
      ))}
    </time>
  )
}
