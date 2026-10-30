import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export type OutcomeTone = 'positive' | 'negative' | 'neutral'

export interface OutcomeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: ReactNode
  /** 0–1. Drives the 10% fill width and the default price readout. */
  probability: number
  /** Right-hand readout; default `62¢`. */
  price?: ReactNode
  /** positive (Yes) / negative (No) / neutral (multi-outcome). */
  tone?: OutcomeTone
  /** aria-pressed. */
  selected?: boolean
  loading?: boolean
  invalid?: boolean
}

export function OutcomeButton({ label, probability, price, tone = 'neutral', selected, loading, invalid, disabled, className, style, children, ...rest }: OutcomeButtonProps) {
  const { number } = useNuiLocale()
  const p = Math.min(1, Math.max(0, Number.isFinite(probability) ? probability : 0))
  return (
    <button
      type="button"
      className={cx('nui-outcome', className)}
      data-tone={tone !== 'neutral' ? tone : undefined}
      aria-pressed={!!selected}
      aria-busy={loading || undefined}
      aria-invalid={invalid || undefined}
      disabled={disabled || loading}
      style={{ '--_pct': `${p * 100}%`, ...style } as CSSProperties}
      {...rest}
    >
      <span className="nui-outcome__label">
        {loading && <span className="nui-spinner" aria-hidden="true" />}
        {label}
        {children}
      </span>
      <span className="nui-outcome__price">{price ?? `${number(Math.round(p * 100))}¢`}</span>
    </button>
  )
}
