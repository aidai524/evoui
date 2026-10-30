import { useId, useRef, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { ChevronIcon } from '../../icons'
import { fiatValue, formatAmount, formatFiatDecimal, formatUnits, percentOf, sanitizeAmountInput, toDecimalString, tryParseUnits } from '../../utils/amount'
import { cx } from '../../utils/cx'
import { FloatingPanel } from '../overlays/floating'
import { Skeleton } from '../surfaces/Feedback'
import { PriceChange } from '../zcash/Amount'
import { TokenIcon } from '../zcash/token'
import { TokenList, type PickerToken } from './TokenPicker'

export interface TokenRef {
  symbol: string
  name?: string
  decimals?: number
  /** Icon URL */
  src?: string
}

export interface TokenAmountInputProps<T extends PickerToken = PickerToken> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  /** Decimal string exactly as typed (never a float). */
  value: string
  /** Receives the sanitized decimal string. */
  onChange?: (value: string) => void
  /** Selected token; null/undefined shows the accent "Select token" call to action and disables the amount. */
  token?: TokenRef | null
  /** External picker (e.g. open a TokenPicker dialog). Ignored when `tokens` is given. */
  onTokenClick?: () => void
  /** Built-in dropdown: clicking the token button opens an anchored search + list of these tokens. */
  tokens?: T[]
  /** Called with the token picked in the built-in dropdown. */
  onTokenChange?: (token: T) => void
  /** Symbols shown as quick-pick chips in the dropdown. */
  popularTokens?: string[]
  /** Symbols that cannot be picked in the dropdown (e.g. the other side of a swap). */
  disabledTokens?: string[]
  label: ReactNode
  /** Right side of the top row, e.g. a PrivacyBadge. */
  aside?: ReactNode
  /** Left side of the bottom row, e.g. "≈ $117.40". Overrides the value computed from `price`. */
  fiat?: ReactNode
  /** Fiat price of one token (number or decimal string). The fiat line is computed from the typed amount without floats. */
  price?: number | string
  /** ISO currency of `price` (default 'USD'). */
  currency?: string
  /** 24h change of `price` in percent, shown next to the unit price while the amount is empty. */
  priceChange?: number
  /** bigint base units. `0n` shows "No balance" and hides Max. */
  balance?: bigint
  /** Defaults to token.decimals ?? 8. */
  decimals?: number
  /** Called with formatUnits(balance, decimals) — a decimal string, not a bigint. */
  onMax?: (value: string) => void
  /** Quick picks in percent of the balance, e.g. [25, 50, 75, 100]; 100 is labelled Max. Values go through onChange (100 → onMax if given). */
  percentages?: number[]
  /** Mark amounts above `balance` invalid with "Insufficient balance" (default true). */
  validateBalance?: boolean
  /** Error message for the bottom row; implies invalid. */
  error?: ReactNode
  /** Skeletons for balance and fiat while they load. */
  loading?: boolean
  readOnly?: boolean
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  inputId?: string
}

export function TokenAmountInput<T extends PickerToken = PickerToken>({
  value,
  onChange,
  token,
  onTokenClick,
  tokens,
  onTokenChange,
  popularTokens,
  disabledTokens,
  label,
  aside,
  fiat,
  price,
  currency = 'USD',
  priceChange,
  balance,
  decimals,
  onMax,
  percentages,
  validateBalance = true,
  error,
  loading,
  readOnly,
  invalid,
  disabled,
  placeholder = '0',
  inputId,
  className,
  onMouseDown,
  ...rest
}: TokenAmountInputProps<T>) {
  const { m, locale } = useNuiLocale()
  const uid = useId()
  const labelId = `${uid}-label`
  const msgId = `${uid}-msg`
  const id = inputId ?? `${uid}-input`
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const dec = decimals ?? token?.decimals ?? 8
  const noToken = !token
  const interactive = !readOnly && !disabled && !noToken
  const units = token && value ? tryParseUnits(value, dec) : null
  const over = validateBalance && interactive && balance != null && units != null && units > balance
  const message = error ?? (over ? m.insufficientBalance : null)
  const isInvalid = !!invalid || message != null
  const hasBalance = balance != null && balance > 0n && !loading
  const quick = interactive && hasBalance && onChange && percentages?.length ? percentages : null
  const showMax = !quick && !!onMax && interactive && hasBalance

  const builtIn = !!tokens
  const canPick = !disabled && (builtIn || !!onTokenClick)

  // Fiat line: explicit `fiat` > amount × price > unit price (while empty).
  const priceStr = price != null ? toDecimalString(price) : null
  const unitPrice = priceStr != null && token ? `1 ${token.symbol} = ${formatFiatDecimal(priceStr, currency, locale)}` : undefined
  const computed = priceStr != null ? fiatValue(value, priceStr) : null
  const fiatNode: ReactNode =
    fiat ??
    (computed != null ? (
      `≈ ${formatFiatDecimal(computed, currency, locale)}`
    ) : unitPrice ? (
      <>
        {unitPrice}
        {priceChange != null && <PriceChange value={priceChange} className="nui-token-input__change" />}
      </>
    ) : null)

  const setAmount = (v: string) => onChange?.(v)
  const applyPercent = (p: number) => {
    if (balance == null) return
    const v = formatUnits(percentOf(balance, p), dec)
    if (p >= 100 && onMax) onMax(v)
    else setAmount(v)
  }

  const closeMenu = (focus: 'input' | 'select') => {
    setMenuOpen(false)
    // After the parent re-renders with the new token, the amount input is enabled.
    requestAnimationFrame(() => (focus === 'input' && inputRef.current && !inputRef.current.disabled ? inputRef.current : selectRef.current)?.focus())
  }

  // Clicking the empty parts of the box focuses the amount (portaled dropdown clicks bubble here too: ignore them).
  const onBoxMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    onMouseDown?.(e)
    const t = e.target as HTMLElement
    if (!interactive || !e.currentTarget.contains(t) || t.closest('button, input, a, label, [role="dialog"]')) return
    e.preventDefault()
    inputRef.current?.focus()
  }

  const showBottom = fiatNode != null || balance != null || loading || message != null || noToken || price != null

  return (
    <div
      className={cx('nui-token-input', className)}
      role="group"
      aria-labelledby={labelId}
      aria-busy={loading || undefined}
      data-invalid={isInvalid || undefined}
      data-readonly={readOnly || undefined}
      data-empty={noToken || undefined}
      aria-disabled={disabled || undefined}
      onMouseDown={onBoxMouseDown}
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
          ref={inputRef}
          id={id}
          className="nui-token-input__amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          disabled={disabled || noToken}
          aria-invalid={isInvalid || undefined}
          aria-describedby={message != null || noToken ? msgId : undefined}
          onChange={(e) => setAmount(sanitizeAmountInput(e.target.value, dec))}
        />
        <button
          ref={selectRef}
          type="button"
          className={cx('nui-token-select', noToken && 'nui-token-select--empty')}
          aria-haspopup="dialog"
          aria-expanded={builtIn ? menuOpen : undefined}
          onClick={builtIn ? () => setMenuOpen((o) => !o) : onTokenClick}
          disabled={!canPick}
        >
          {token ? (
            <>
              <TokenIcon symbol={token.symbol} src={token.src} />
              <span>{token.symbol}</span>
            </>
          ) : (
            <span>{m.selectToken}</span>
          )}
          {canPick && <ChevronIcon size={10} className="nui-token-select__chevron" />}
        </button>
      </div>
      {showBottom && (
        <div className="nui-token-input__bottom">
          {message != null ? (
            <span className="nui-token-input__message" id={msgId} role="alert">
              {message}
            </span>
          ) : noToken ? (
            <span className="nui-token-input__hint" id={msgId}>
              {m.selectTokenFirst}
            </span>
          ) : loading && fiat == null ? (
            <Skeleton width="5em" />
          ) : (
            <span className="nui-token-input__fiat" title={computed != null ? unitPrice : undefined}>
              {fiatNode}
            </span>
          )}
          {!noToken && (loading || balance != null) && (
            <span className="nui-token-input__balance">
              {loading ? (
                <Skeleton width="7em" />
              ) : balance === 0n ? (
                <span className="nui-token-input__none">{m.noBalance}</span>
              ) : (
                balance != null && (
                  <span>
                    {m.balance} {formatAmount(balance, { decimals: dec, locale })}
                  </span>
                )
              )}
              {showMax && balance != null && (
                <button type="button" className="nui-token-input__max" onClick={() => onMax?.(formatUnits(balance, dec))}>
                  {m.max}
                </button>
              )}
              {quick && balance != null && (
                <span className="nui-token-input__quick" role="group" aria-label={m.quickAmounts}>
                  {quick.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="nui-token-input__max"
                      aria-label={p >= 100 ? undefined : `${p}% ${m.ofBalance}`}
                      aria-pressed={value !== '' && value === formatUnits(percentOf(balance, p), dec)}
                      onClick={() => applyPercent(p)}
                    >
                      {p >= 100 ? m.max : `${p}%`}
                    </button>
                  ))}
                </span>
              )}
            </span>
          )}
        </div>
      )}
      {builtIn && (
        <FloatingPanel
          open={menuOpen}
          anchor={selectRef}
          placement="bottom-end"
          onDismiss={() => setMenuOpen(false)}
          role="dialog"
          aria-label={m.selectToken}
          className="nui-token-input__menu"
        >
          <TokenList
            tokens={tokens}
            selected={token?.symbol}
            disabled={disabledTokens}
            popular={popularTokens}
            onEscape={() => closeMenu('select')}
            onPick={(t) => {
              onTokenChange?.(t)
              closeMenu('input')
            }}
          />
        </FloatingPanel>
      )}
    </div>
  )
}
