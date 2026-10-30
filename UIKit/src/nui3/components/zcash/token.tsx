import type { HTMLAttributes } from 'react'
import { cx } from '../../utils/cx'

export type TokenIconSize = 'sm' | 'md' | 'lg'

export interface TokenIconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  symbol: string
  /** Image URL; falls back to the first letter. */
  src?: string
  size?: TokenIconSize
  /** Accessible name when the icon stands alone; otherwise decorative. */
  label?: string
}

export function TokenIcon({ symbol, src, size = 'md', label, className, ...rest }: TokenIconProps) {
  const zec = symbol.toUpperCase() === 'ZEC'
  return (
    <span
      className={cx('nui-token-icon', size !== 'md' && `nui-token-icon--${size}`, zec && 'nui-token-icon--zec', className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...rest}
    >
      {src ? <img src={src} alt="" /> : symbol.charAt(0).toUpperCase()}
    </span>
  )
}

export interface TokenPairProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  base: string
  quote: string
  baseSrc?: string
  quoteSrc?: string
  size?: TokenIconSize
  label?: string
}

/** Two overlapping icons (−30% of the size); the second gets a 2px surface ring. */
export function TokenPair({ base, quote, baseSrc, quoteSrc, size = 'md', label, className, ...rest }: TokenPairProps) {
  return (
    <span
      className={cx('nui-token-pair', size !== 'md' && `nui-token-pair--${size}`, className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...rest}
    >
      <TokenIcon symbol={base} src={baseSrc} size={size} />
      <TokenIcon symbol={quote} src={quoteSrc} size={size} />
    </span>
  )
}
