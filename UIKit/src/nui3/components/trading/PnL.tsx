import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { formatFiat, formatPercent } from '../../utils/amount'
import { cx } from '../../utils/cx'

export interface PnLProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Fiat value (display only; positions settle in base units elsewhere). */
  value: number
  /** Percent units, shown small after the value. */
  percent?: number
  currency?: string
}

/** Signed profit / loss: positive green, negative red. */
export function PnL({ value, percent, currency = 'USD', className, ...rest }: PnLProps) {
  const { locale } = useNuiLocale()
  const dir = value > 0 ? 'positive' : value < 0 ? 'negative' : undefined
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return (
    <span className={cx('nui-pnl', className)} data-sign={dir} {...rest}>
      {sign}
      {formatFiat(Math.abs(value), currency, locale)}
      {percent != null && (
        <small>
          {percent > 0 ? '+' : percent < 0 ? '−' : ''}
          {formatPercent(Math.abs(percent), 2, locale)}
        </small>
      )}
    </span>
  )
}
