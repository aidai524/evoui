import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNuiLocale } from '../../i18n'
import { formatAmount } from '../../utils/amount'
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
  disabled = [],
  popular,
  title,
}: TokenPickerProps<T>) {
  const { m, locale } = useNuiLocale()
  const uid = useId()
  const listId = `${uid}-list`
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const isDisabled = (t: T) => disabled.includes(t.symbol)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tokens
    return tokens.filter((t) => [t.symbol, t.name, t.address ?? ''].some((s) => s.toLowerCase().includes(q)))
  }, [tokens, query])

  // Reset on open; focus the search after showModal() has run (the Dialog's effect runs after ours).
  useEffect(() => {
    if (!open) return
    setQuery('')
    const sel = tokens.findIndex((t) => t.symbol === selected && !disabled.includes(t.symbol))
    setActive(sel >= 0 ? sel : Math.max(0, tokens.findIndex((t) => !disabled.includes(t.symbol))))
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active]')?.scrollIntoView({ block: 'nearest' })
  }, [active, results])

  const pick = (t: T | undefined) => {
    if (!t || isDisabled(t)) return
    onSelect(t)
    onClose()
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
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[active])
    }
  }

  const popularTokens = popular?.map((s) => tokens.find((t) => t.symbol === s)).filter((t): t is T => !!t)
  const activeToken = results[active]

  return (
    <Dialog open={open} onClose={onClose} title={title ?? m.selectToken} width={440}>
      <div className="nui-token-picker">
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
              return (
                <li
                  key={t.symbol}
                  id={`${uid}-opt-${t.symbol}`}
                  role="option"
                  className="nui-token-list__item"
                  aria-selected={t.symbol === selected}
                  aria-disabled={dis || undefined}
                  data-active={i === active || undefined}
                  onMouseMove={() => !dis && i !== active && setActive(i)}
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
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Dialog>
  )
}
