import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { ChevronIcon } from '../../icons'
import { formatAmount, formatUnits, sanitizeAmountInput } from '../../utils/amount'
import { cx } from '../../utils/cx'
import { TokenIcon } from '../zcash/token'

export interface TokenRef {
  symbol: string
  name?: string
  decimals?: number
  /** Icon URL */
  src?: string
}

export interface TokenAmountInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  /** Decimal string exactly as typed (never a float). */
  value: string
  /** Receives the sanitized decimal string. */
  onChange?: (value: string) => void
  token?: TokenRef | null
  onTokenClick?: () => void
  label: ReactNode
  /** Right side of the top row, e.g. a PrivacyBadge. */
  aside?: ReactNode
  /** Left side of the bottom row, e.g. "≈ $117.40". */
  fiat?: ReactNode
  /** bigint base units. */
  balance?: bigint
  /** Defaults to token.decimals ?? 8. */
  decimals?: number
  /** Called with formatUnits(balance, decimals) — a decimal string, not a bigint. */
  onMax?: (value: string) => void
  readOnly?: boolean
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  inputId?: string
}

export function TokenAmountInput({
  value,
  onChange,
  token,
  onTokenClick,
  label,
  aside,
  fiat,
  balance,
  decimals,
  onMax,
  readOnly,
  invalid,
  disabled,
  placeholder = '0',
  inputId,
  className,
  ...rest
}: TokenAmountInputProps) {
  const { m, locale } = useNuiLocale()
  const uid = useId()
  const labelId = `${uid}-label`
  const id = inputId ?? `${uid}-input`
  const dec = decimals ?? token?.decimals ?? 8
  const showMax = !!onMax && balance != null && !readOnly && !disabled
  return (
    <div
      className={cx('nui-token-input', className)}
      role="group"
      aria-labelledby={labelId}
      data-invalid={invalid || undefined}
      data-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      <div className="nui-token-input__top">
        <label className="nui-token-input__label" id={labelId} htmlFor={id}>
          {label}
        </label>
        {aside}
      </div>
      <div className="nui-token-input__main">
        <input
          id={id}
          className="nui-token-input__amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange?.(sanitizeAmountInput(e.target.value, dec))}
        />
        <button
          type="button"
          className={cx('nui-token-select', !token && 'nui-token-select--empty')}
          aria-haspopup="dialog"
          onClick={onTokenClick}
          disabled={disabled || !onTokenClick}
        >
          {token ? (
            <>
              <TokenIcon symbol={token.symbol} src={token.src} />
              <span>{token.symbol}</span>
            </>
          ) : (
            <span>{m.selectToken}</span>
          )}
          {onTokenClick && <ChevronIcon size={10} className="nui-token-select__chevron" />}
        </button>
      </div>
      {(fiat != null || balance != null) && (
        <div className="nui-token-input__bottom">
          <span className="nui-token-input__fiat">{fiat}</span>
          {balance != null && (
            <span className="nui-token-input__balance">
              {m.balance} {formatAmount(balance, { decimals: dec, locale })}
              {showMax && (
                <button type="button" className="nui-token-input__max" onClick={() => onMax?.(formatUnits(balance, dec))}>
                  {m.max}
                </button>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
