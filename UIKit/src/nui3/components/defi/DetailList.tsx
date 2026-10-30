import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

export interface DetailItem {
  label: ReactNode
  value: ReactNode
  key?: string
}

export interface DetailListProps extends Omit<HTMLAttributes<HTMLDListElement>, 'children'> {
  items: DetailItem[]
}

/** Label / value rows for rates, routes, slippage and fees. */
export function DetailList({ items, className, ...rest }: DetailListProps) {
  return (
    <dl className={cx('nui-detail-list', className)} {...rest}>
      {items.map((it, i) => (
        <div className="nui-detail-list__row" key={it.key ?? i}>
          <dt className="nui-detail-list__label">{it.label}</dt>
          <dd className="nui-detail-list__value">{it.value}</dd>
        </div>
      ))}
    </dl>
  )
}
