import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNuiLocale } from '../../i18n'
import { CheckIcon } from '../../icons'
import { formatAmount } from '../../utils/amount'
import { cx } from '../../utils/cx'
import { SearchInput } from '../forms'
import { Dialog } from '../overlays'
import { TokenIcon } from '../zcash/token'

export interface PickerToken {
  symbol: string
  name: string
  decimals: number
  /** bigint base units */
  balance?: bigint
  src?: string
  /** Contract / asset id, searchable. */
  address?: string
}

export interface TokenListProps<T extends PickerToken = PickerToken> {
  tokens: T[]
  /** Called with the chosen (enabled) token. */
  onPick: (token: T) => void
  /** Selected symbol (gets aria-selected + a check). */
  selected?: string
  /** Symbols that cannot be picked. */
  disabled?: string[]
  /** Symbols shown as quick-pick chips above the list. */
  popular?: string[]
  /** Esc in an empty search box (a non-empty box is cleared first). */
  onEscape?: () => void
  /** Focus the search box on mount (default true). */
  autoFocus?: boolean
  className?: string
}

/**
 * Search box + optional popular chips + listbox of tokens; shared by TokenPicker (dialog) and
 * TokenAmountInput's built-in dropdown. ↑/↓ move the active option, Enter picks, Esc clears then escapes.
 */
export function TokenList<T extends PickerToken = PickerToken>({
  tokens,
  onPick,
  selected,
  disabled = [],
  popular,
  onEscape,
  autoFocus = true,
  className,
}: TokenListProps<T>) {
  const { m, locale } = useNuiLocale()
  const uid = useId()
  const listId = `${uid}-list`
  const [query, setQuery] = useState('')
  const isDisabled = (t: T) => disabled.includes(t.symbol)
  const [active, setActive] = useState(() => {
    const sel = tokens.findIndex((t) => t.symbol === selected && !disabled.includes(t.symbol))
    return sel >= 0 ? sel : Math.max(0, tokens.findIndex((t) => !disabled.includes(t.symbol)))
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tokens
    return tokens.filter((t) => [t.symbol, t.name, t.address ?? ''].some((s) => s.toLowerCase().includes(q)))
  }, [tokens, query])

  // Focus after the container (showModal() / floating panel) has mounted and positioned.
  useEffect(() => {
    if (!autoFocus) return
    const id = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(id)
  }, [autoFocus])

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active]')?.scrollIntoView({ block: 'nearest' })
  }, [active, results])

  const pick = (t: T | undefined) => {
    if (!t || isDisabled(t)) return
    onPick(t)
  }

  const move = (dir: 1 | -1) => {
    if (results.length === 0) return
    let i = active
    for (let n = 0; n < results.length; n++) {
      i = (i + dir + results.length) % results.length
      if (!isDisabled(results[i])) break
    }
    setActive(i)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Home' || e.key === 'End') {
      if (!query) {
        e.preventDefault()
        setActive(e.key === 'Home' ? 0 : results.length - 1)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[active])
    } else if (e.key === 'Escape' && !query && onEscape) {
      e.preventDefault()
      e.stopPropagation()
      onEscape()
    }
  }

  const popularTokens = popular?.map((s) => tokens.find((t) => t.symbol === s)).filter((t): t is T => !!t)
  const activeToken = results[active]

  return (
    <div className={cx('nui-token-picker', className)}>
      <SearchInput
        ref={inputRef}
        label={m.searchTokens}
        placeholder={m.searchTokensPlaceholder}
        shortcut={false}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onClear={() => setQuery('')}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeToken ? `${uid}-opt-${activeToken.symbol}` : undefined}
      />
      {popularTokens && popularTokens.length > 0 && (
        <div className="nui-token-picker__popular" role="group" aria-label={m.tokens}>
          {popularTokens.map((t) => (
            <button
              key={t.symbol}
              type="button"
              className="nui-token-picker__chip"
              aria-pressed={t.symbol === selected}
              disabled={isDisabled(t)}
              onClick={() => pick(t)}
            >
              <TokenIcon symbol={t.symbol} src={t.src} size="sm" />
              {t.symbol}
            </button>
          ))}
        </div>
      )}
      {results.length === 0 ? (
        <p className="nui-token-picker__empty" role="status">
          {m.noTokensMatch}
        </p>
      ) : (
        <ul className="nui-token-list" role="listbox" id={listId} aria-label={m.tokens} ref={listRef}>
          {results.map((t, i) => {
            const dis = isDisabled(t)
            const sel = t.symbol === selected
            return (
              <li
                key={t.symbol}
                id={`${uid}-opt-${t.symbol}`}
                role="option"
                className="nui-token-list__item"
                aria-selected={sel}
                aria-disabled={dis || undefined}
                data-active={i === active || undefined}
                onMouseMove={() => !dis && i !== active && setActive(i)}
                // Keep focus in the search box (the combobox owns focus; options are aria-activedescendant).
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(t)}
              >
                <TokenIcon symbol={t.symbol} src={t.src} />
                <span className="nui-token-list__name">
                  <span className="nui-token-list__symbol">{t.symbol}</span>
                  <span className="nui-token-list__full">{t.name}</span>
                </span>
                {t.balance != null && (
                  <span className="nui-token-list__balance">{formatAmount(t.balance, { decimals: t.decimals, locale })}</span>
                )}
                <span className="nui-token-list__check">{sel && <CheckIcon size={12} />}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export interface TokenPickerProps<T extends PickerToken = PickerToken> {
  open: boolean
  onClose: () => void
  tokens: T[]
  /** Called with the chosen token; the picker then closes itself (onClose). */
  onSelect: (token: T) => void
  /** Selected symbol. */
  selected?: string
  /** Symbols that cannot be picked (e.g. the other side of a swap). */
  disabled?: string[]
  /** Symbols shown as quick picks above the list. */
  popular?: string[]
  title?: string
}

/** Dialog + autofocused search + listbox. ↑/↓ move, Enter picks, Esc closes. */
export function TokenPicker<T extends PickerToken = PickerToken>({
  open,
  onClose,
  tokens,
  onSelect,
  selected,
  disabled,
  popular,
  title,
}: TokenPickerProps<T>) {
  const { m } = useNuiLocale()
  return (
    <Dialog open={open} onClose={onClose} title={title ?? m.selectToken} width={440}>
      {/* Dialog renders children only while open, so the list resets on every open. */}
      <TokenList
        tokens={tokens}
        selected={selected}
        disabled={disabled}
        popular={popular}
        onEscape={onClose}
        onPick={(t) => {
          onSelect(t)
          onClose()
        }}
      />
    </Dialog>
  )
}
