import type { HTMLAttributes, ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { Progress } from '../surfaces'

export interface SyncProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Highest scanned block height. */
  scanned: number
  /** Chain tip height. */
  tip: number
  /** Wallet birthday / first height to scan (default 0). */
  start?: number
  /** Remaining time, already formatted by the app (e.g. "≈ 4 min"). */
  eta?: ReactNode
}

/** Wallet scan progress: state + percent, scanned / tip heights, start and ETA, plus a Progress bar. */
export function SyncProgress({ scanned, tip, start = 0, eta, className, ...rest }: SyncProgressProps) {
  const { m, number } = useNuiLocale()
  const span = Math.max(1, tip - start)
  const pct = Math.min(100, Math.max(0, ((scanned - start) / span) * 100))
  const done = scanned >= tip
  const pctText = number(done ? 100 : Math.floor(pct * 10) / 10, { maximumFractionDigits: 1 })
  return (
    <div className={cx('nui-sync', className)} data-state={done ? 'synced' : 'syncing'} {...rest}>
      <div className="nui-sync__row">
        <span className="nui-sync__label" aria-live="polite">
          {done ? m.synced : m.syncing}
        </span>
        <span>{pctText}%</span>
      </div>
      <Progress value={done ? 100 : pct} label={done ? m.synced : m.syncing} />
      <div className="nui-sync__row">
        <span>
          {number(scanned)} / {number(tip)}
        </span>
        {eta != null && !done && <span>{eta}</span>}
      </div>
      {start > 0 && (
        <div className="nui-sync__row">
          <span>
            {number(start)} – {number(tip)}
          </span>
        </div>
      )}
    </div>
  )
}
