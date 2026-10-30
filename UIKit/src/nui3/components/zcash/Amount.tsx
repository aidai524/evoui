import type { HTMLAttributes, ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { formatAmount, formatFiat, formatPercent, ZEC_DECIMALS } from '../../utils/amount'
import { cx } from '../../utils/cx'

export interface AmountProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** bigint base units (zatoshi for ZEC). */
  value: bigint
  decimals?: number
  /** Unit label; null hides it. */
  symbol?: string | null
  /** Full precision (confirmation pages, receipts). */
  exact?: boolean
  /** Fiat value: a number is formatted with formatFiat, a node is shown as-is. */
  fiat?: number | ReactNode
  currency?: string
  /** Privacy mode: renders •••••• and announces "Amount hidden". */
  hidden?: boolean
  /** 'auto' adds +/- and colours positive/negative. */
  sign?: 'auto' | 'none'
  size?: 'md' | 'lg'
}

/** Fixed-point amount. ≤ 4 decimals by default; tiny non-zero values show <0.0001, never 0. */
export function Amount({
  value,
  decimals = ZEC_DECIMALS,
  symbol = 'ZEC',
  exact,
  fiat,
  currency = 'USD',
  hidden,
  sign = 'none',
  size = 'md',
  className,
  ...rest
}: AmountProps) {
  const { m, locale } = useNuiLocale()
  const text = formatAmount(value, { decimals, exact, locale })
  const full = formatAmount(value, { decimals, exact: true, locale })
  const dir = value > 0n ? 'positive' : value < 0n ? 'negative' : undefined
  const plus = sign === 'auto' && dir === 'positive' ? '+' : ''
  const unit = symbol ? ` ${symbol}` : ''
  return (
    <span
      className={cx('nui-amount', size === 'lg' && 'nui-amount--lg', className)}
      data-sign={sign === 'auto' && !hidden ? dir : undefined}
      title={hidden ? undefined : `${plus}${full}${unit}`}
      {...rest}
    >
      {hidden ? (
        <span className="nui-amount__value">
          <span aria-hidden="true">••••••</span>
          <span className="nui-sr-only">{m.amountHidden}</span>
        </span>
      ) : (
        <span className="nui-amount__value">
          {plus}
          {text}
        </span>
      )}
      {symbol && <span className="nui-amount__unit">{symbol}</span>}
      {fiat != null && !hidden && (
        <span className="nui-amount__fiat">≈ {typeof fiat === 'number' ? formatFiat(fiat, currency, locale) : fiat}</span>
      )}
    </span>
  )
}

export interface PriceChangeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Percent units: 2.5 → ▲ 2.50% */
  value: number
  digits?: number
}

export function PriceChange({ value, digits = 2, className, ...rest }: PriceChangeProps) {
  const { m, locale } = useNuiLocale()
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : undefined
  return (
    <span className={cx('nui-delta', dir && `nui-delta--${dir}`, className)} {...rest}>
      {dir && (
        <>
          <span className="nui-delta__arrow" aria-hidden="true">
            {dir === 'up' ? '▲ ' : '▼ '}
          </span>
          <span className="nui-sr-only">{dir === 'up' ? m.increase : m.decrease} </span>
        </>
      )}
      {formatPercent(Math.abs(value), digits, locale)}
    </span>
  )
}
