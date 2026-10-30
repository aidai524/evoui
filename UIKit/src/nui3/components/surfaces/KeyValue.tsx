import { Fragment, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../utils/cx'

export type KeyValueItem = readonly [label: ReactNode, value: ReactNode]

export interface KeyValueProps extends HTMLAttributes<HTMLDListElement> {
  /** `[label, value]` pairs. Alternatively pass `<dt>/<dd>` children. */
  items?: readonly KeyValueItem[]
  /** Left-align values (long text, addresses). Default: right-aligned tabular. */
  left?: boolean
}

export function KeyValue({ items, left, className, children, ...rest }: KeyValueProps) {
  return (
    <dl className={cx('nui-kv', left && 'nui-kv--left', className)} {...rest}>
      {items
        ? items.map(([k, v], i) => (
            <Fragment key={i}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </Fragment>
          ))
        : children}
    </dl>
  )
}
