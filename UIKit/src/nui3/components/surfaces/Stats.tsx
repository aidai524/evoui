import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

export interface StatsProps extends HTMLAttributes<HTMLDListElement> {
  /** 1px left rule + 56px left padding between items (removed ≤640px). */
  divided?: boolean
}

/** KPI row. Rendered as a `<dl>`; each `Stat` is a `div > dt + dd`. */
export function Stats({ divided, className, ...rest }: StatsProps) {
  return <dl className={cx('nui-stats', divided && 'nui-stats--divided', className)} {...rest} />
}

export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  label: ReactNode
  value: ReactNode
  /** Unit / suffix rendered as `<small>` (.45em, 600, text-muted). */
  unit?: ReactNode
  /** `sm`: value 26px/800. */
  size?: 'md' | 'sm'
}

export function Stat({ label, value, unit, size = 'md', className, ...rest }: StatProps) {
  return (
    <div className={cx('nui-stat', size === 'sm' && 'nui-stat--sm', className)} {...rest}>
      <dt className="nui-stat__label">{label}</dt>
      <dd className="nui-stat__value">
        {value}
        {unit != null && <small> {unit}</small>}
      </dd>
    </div>
  )
}
