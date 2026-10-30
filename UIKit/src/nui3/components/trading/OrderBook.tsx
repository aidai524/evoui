import type { CSSProperties, HTMLAttributes, KeyboardEvent } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export interface BookLevel {
  price: number
  size: number
}

export type BookSide = 'bid' | 'ask'

export interface OrderBookProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  bids: BookLevel[]
  asks: BookLevel[]
  /** Levels shown per side. */
  rows?: number
  priceDecimals?: number
  sizeDecimals?: number
  last?: number
  lastDirection?: 'up' | 'down'
  /** Makes each row focusable / clickable. */
  onSelectPrice?: (price: number, side: BookSide) => void
}

export function OrderBook({
  bids,
  asks,
  rows = 8,
  priceDecimals = 2,
  sizeDecimals = 2,
  last,
  lastDirection,
  onSelectPrice,
  className,
  ...rest
}: OrderBookProps) {
  const { m, number } = useNuiLocale()
  const fp = (n: number) => number(n, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })
  const fs = (n: number) => number(n, { minimumFractionDigits: sizeDecimals, maximumFractionDigits: sizeDecimals })

  const cumulate = (levels: BookLevel[]) => {
    let t = 0
    return levels.map((l) => ({ ...l, total: (t += l.size) }))
  }
  const b = cumulate([...bids].sort((x, y) => y.price - x.price).slice(0, rows))
  const a = cumulate([...asks].sort((x, y) => x.price - y.price).slice(0, rows))
  const maxTotal = Math.max(b.at(-1)?.total ?? 0, a.at(-1)?.total ?? 0) || 1
  const spread = a[0] && b[0] ? a[0].price - b[0].price : undefined

  const row = (l: BookLevel & { total: number }, side: BookSide) => {
    const sideLabel = side === 'bid' ? m.bids : m.asks
    const interactive = !!onSelectPrice
    const select = () => onSelectPrice?.(l.price, side)
    return (
      <div
        key={`${side}-${l.price}`}
        className={cx('nui-book__row', `nui-book__row--${side}`)}
        style={{ '--_depth': `${(l.total / maxTotal) * 100}%` } as CSSProperties}
        {...(interactive
          ? {
              role: 'button',
              tabIndex: 0,
              'aria-label': `${sideLabel} ${fp(l.price)}, ${m.size} ${fs(l.size)}`,
              onClick: select,
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  select()
                }
              },
            }
          : { 'aria-label': `${sideLabel} ${fp(l.price)}, ${m.size} ${fs(l.size)}` , role: 'listitem' })}
      >
        <span className="nui-book__price">{fp(l.price)}</span>
        <span>{fs(l.size)}</span>
        <span>{fs(l.total)}</span>
      </div>
    )
  }

  return (
    <div className={cx('nui-book', className)} {...rest}>
      <div className="nui-book__head" aria-hidden="true">
        <span>{m.price}</span>
        <span>{m.size}</span>
        <span>{m.total}</span>
      </div>
      <div className="nui-book__side" role={onSelectPrice ? 'group' : 'list'} aria-label={m.asks}>
        {[...a].reverse().map((l) => row(l, 'ask'))}
      </div>
      <div className="nui-book__mid">
        {last != null && (
          <strong className={cx('nui-book__last', lastDirection && `nui-book__last--${lastDirection}`)} title={m.lastPrice}>
            <span className="nui-sr-only">{m.lastPrice} </span>
            {fp(last)}
            {lastDirection && <span aria-hidden="true">{lastDirection === 'up' ? ' ▲' : ' ▼'}</span>}
          </strong>
        )}
        {spread != null && (
          <span className="nui-book__spread">
            {m.spread} {fp(spread)}
          </span>
        )}
      </div>
      <div className="nui-book__side" role={onSelectPrice ? 'group' : 'list'} aria-label={m.bids}>
        {b.map((l) => row(l, 'bid'))}
      </div>
    </div>
  )
}
