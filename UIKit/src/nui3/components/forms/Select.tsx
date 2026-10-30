// Custom listbox Select (WAI-ARIA "select-only combobox"): a button trigger that looks like .nui-input,
// a portaled FloatingPanel listbox with rich rows, optional search, multiple selection and clearing.
import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { useNuiLocale } from '../../i18n'
import { CheckIcon, ChevronIcon, CloseIcon, SearchIcon } from '../../icons'
import { cx } from '../../utils/cx'
import { FloatingPanel, type Placement } from '../overlays/floating'
import { isTypeaheadKey, moveIndex, typeaheadIndex, useTypeahead, type NavMove } from '../overlays/listNav'
import { assignRef } from '../overlays/refs'
import { useFieldControl } from './Field'

/** Object form of an option. Extra fields (balance, flag…) are passed through to `renderOption` / `renderValue`. */
export interface SelectOptionItem {
  value: string
  /** Row and trigger content; defaults to `value`. */
  label?: ReactNode
  /** Second, muted line under the label. */
  description?: ReactNode
  /** Leading visual (TokenIcon, flag, icon). */
  icon?: ReactNode
  disabled?: boolean
  /** Options sharing a group are listed together under this heading (first-appearance order). */
  group?: string
  /** Plain text for type-ahead, search and chips when `label` is not a string. */
  textValue?: string
}

export type SelectOption<O extends SelectOptionItem = SelectOptionItem> = string | O

export interface SelectRenderState {
  selected: boolean
  /** Keyboard / hover highlight (aria-activedescendant). */
  active: boolean
  disabled: boolean
}

interface SelectBaseProps<O extends SelectOptionItem>
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'defaultValue' | 'onChange' | 'children' | 'type' | 'name'> {
  options: readonly SelectOption<O>[]
  /** Shown while nothing is selected (default "Select…"). */
  placeholder?: ReactNode
  /** Custom row content (replaces icon + label + description; the check mark stays). */
  renderOption?: (option: O, state: SelectRenderState) => ReactNode
  /** Custom trigger content for a selected option (and each chip when `multiple`). */
  renderValue?: (option: O) => ReactNode
  /** Renders hidden input(s) so the value posts with a <form>. */
  name?: string
  /** Filter field at the top of the panel. */
  searchable?: boolean
  searchPlaceholder?: string
  /** Custom match for `searchable` (default: label / textValue / value / description contain the query). */
  filter?: (option: O, query: string) => boolean
  /** Shown when the search matches nothing (default "No results"). */
  emptyText?: ReactNode
  /** Clear button in the trigger (Backspace / Delete clear too). */
  clearable?: boolean
  invalid?: boolean
  placement?: Placement
  onOpenChange?: (open: boolean) => void
  /** Class for the floating panel. */
  panelClassName?: string
  ref?: Ref<HTMLButtonElement>
}

export interface SingleSelectProps<O extends SelectOptionItem = SelectOptionItem> extends SelectBaseProps<O> {
  multiple?: false
  /** Controlled value; '' = nothing selected. */
  value?: string
  defaultValue?: string
  onChange?: (value: string, option: O | undefined) => void
}

export interface MultiSelectProps<O extends SelectOptionItem = SelectOptionItem> extends SelectBaseProps<O> {
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[], options: O[]) => void
  /** Up to this many selections render as chips, more as "n selected" (default 3). */
  maxChips?: number
}

export type SelectProps<O extends SelectOptionItem = SelectOptionItem> = SingleSelectProps<O> | MultiSelectProps<O>

interface Entry<O> {
  opt: O
  /** Index in `options` (stable option id). */
  index: number
  text: string
  disabled: boolean
  group?: string
}

const toArray = (v: string | string[] | undefined): string[] => (v === undefined || v === '' ? [] : Array.isArray(v) ? v : [v])

const plain = (n: ReactNode) => (typeof n === 'string' || typeof n === 'number' ? String(n) : '')

function defaultFilter(o: SelectOptionItem, q: string) {
  const needle = q.toLocaleLowerCase()
  return [o.textValue, plain(o.label), o.value, plain(o.description)].some((s) => s && s.toLocaleLowerCase().includes(needle))
}

/** Stable grouping: options of one group are listed together, groups in first-appearance order. */
function grouped<O>(list: Entry<O>[]): Entry<O>[] {
  if (!list.some((e) => e.group)) return list
  const order: (string | undefined)[] = []
  for (const e of list) if (!order.includes(e.group)) order.push(e.group)
  return order.flatMap((g) => list.filter((e) => e.group === g))
}

type AnyProps<O extends SelectOptionItem> = SelectBaseProps<O> & {
  multiple?: boolean
  value?: string | string[]
  defaultValue?: string | string[]
  onChange?: (value: string | string[], option: O | O[] | undefined) => void
  maxChips?: number
}

/**
 * Listbox select. Same footprint as Input (control-h, border, focus underline, invalid, disabled).
 * Keyboard: ↓/↑/Enter/Space/Alt+↓ open; ↑/↓/Home/End/PageUp/PageDown move; Enter/Space pick; Esc closes;
 * Tab closes and moves on; typing jumps to the first matching option.
 */
export function Select<O extends SelectOptionItem = SelectOptionItem>(props: SelectProps<O>) {
  const {
    options,
    placeholder,
    renderOption,
    renderValue,
    name,
    searchable,
    searchPlaceholder,
    filter = defaultFilter,
    emptyText,
    clearable,
    invalid,
    placement = 'bottom-start',
    onOpenChange,
    panelClassName,
    multiple,
    value,
    defaultValue,
    onChange,
    maxChips = 3,
    className,
    style,
    id,
    disabled: disabledProp,
    'aria-describedby': db,
    'aria-invalid': ai,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    onKeyDown,
    onPointerDown,
    onClick,
    ref,
    ...rest
  } = props as AnyProps<O>
  const { m } = useNuiLocale()
  const f = useFieldControl({ id, invalid, 'aria-describedby': db, 'aria-invalid': ai })
  const disabled = disabledProp ?? f.disabled
  const multi = multiple === true
  const uid = useId()
  const listId = `${uid}-listbox`
  const optId = (e: Entry<O>) => `${uid}-opt-${e.index}`

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  // State-backed: the panel content mounts a render after `open` flips (presence + portal host).
  const listRef = useRef<HTMLDivElement | null>(null)
  const [listMounted, setListMounted] = useState(false)
  const setList = useCallback((node: HTMLDivElement | null) => {
    listRef.current = node
    setListMounted(node !== null)
  }, [])
  const [searchEl, setSearchEl] = useState<HTMLInputElement | null>(null)
  const pointer = useRef<string | null>(null)
  const typeahead = useTypeahead()

  const entries = useMemo<Entry<O>[]>(
    () =>
      grouped(
        options.map((o, index) => {
          const opt = (typeof o === 'string' ? { value: o, label: o } : { ...o, label: o.label ?? o.value }) as O
          return { opt, index, text: opt.textValue ?? (plain(opt.label) || opt.value), disabled: Boolean(opt.disabled), group: opt.group }
        }),
      ),
    [options],
  )

  const [inner, setInner] = useState<string[]>(() => toArray(defaultValue))
  const selected = value !== undefined ? toArray(value) : inner
  const isSelected = (v: string) => selected.includes(v)
  const selectedEntries = selected.map((v) => entries.find((e) => e.opt.value === v)).filter((e): e is Entry<O> => !!e)

  const [open, setOpenState] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(-1)

  const filterBy = (q: string) => (searchable && q.trim() ? entries.filter((e) => filter(e.opt, q.trim())) : entries)
  const visible = useMemo(() => (searchable && query.trim() ? entries.filter((e) => filter(e.opt, query.trim())) : entries), [entries, query, searchable, filter])

  /** Selected option if visible, else the first enabled one. */
  const initialIndex = (list: Entry<O>[], how: 'selected' | NavMove = 'selected') => {
    if (how !== 'selected') return moveIndex(list, -1, how)
    const i = list.findIndex((e) => isSelected(e.opt.value) && !e.disabled)
    return i >= 0 ? i : moveIndex(list, -1, 'first')
  }

  const setOpen = (next: boolean) => {
    setOpenState(next)
    onOpenChange?.(next)
  }

  const openWith = (how: 'selected' | NavMove = 'selected', seed = '') => {
    if (disabled) return
    const list = filterBy(seed)
    setQuery(seed)
    setActive(initialIndex(list, how))
    setOpen(true)
  }

  const close = (focusTrigger = true) => {
    setOpen(false)
    typeahead.reset()
    if (focusTrigger) triggerRef.current?.focus({ preventScroll: true })
  }

  const commit = (next: string[]) => {
    if (value === undefined) setInner(next)
    const opts = next.map((v) => entries.find((e) => e.opt.value === v)?.opt).filter((o): o is O => !!o)
    if (multi) onChange?.(next, opts)
    else onChange?.(next[0] ?? '', opts[0])
  }

  const choose = (e: Entry<O> | undefined) => {
    if (!e || e.disabled) return
    const v = e.opt.value
    if (multi) {
      commit(isSelected(v) ? selected.filter((s) => s !== v) : [...selected, v])
      return
    }
    if (!isSelected(v)) commit([v])
    close()
  }

  const clear = () => {
    commit([])
    triggerRef.current?.focus({ preventScroll: true })
  }

  const move = (to: NavMove) => setActive((a) => moveIndex(visible, a, to))

  /** Keys while the panel is open (trigger or search input). Returns true when handled. */
  const handleOpenKey = (e: KeyboardEvent<HTMLElement>, inSearch: boolean): boolean => {
    switch (e.key) {
      case 'ArrowDown':
        if (!e.altKey) move(1)
        break
      case 'ArrowUp':
        if (e.altKey) {
          if (!multi && active >= 0) choose(visible[active])
          else close()
        } else move(-1)
        break
      case 'PageDown':
        move(10)
        break
      case 'PageUp':
        move(-10)
        break
      case 'Home':
      case 'End':
        if (inSearch) return false
        move(e.key === 'Home' ? 'first' : 'last')
        break
      case 'Enter':
        choose(visible[active])
        break
      case 'Escape':
        e.stopPropagation() // keep an enclosing Dialog open
        close()
        break
      case 'Tab':
        // Return focus to the trigger without preventing default: the browser then tabs on from it.
        close(inSearch)
        return false
      case ' ':
        if (inSearch) return false
        if (typeahead.pending()) typeTo(' ')
        else choose(visible[active])
        break
      default:
        if (inSearch || !isTypeaheadKey(e)) return false
        typeTo(e.key)
    }
    e.preventDefault()
    return true
  }

  const typeTo = (char: string) => {
    const q = typeahead.push(char)
    const i = typeaheadIndex(
      visible.map((v) => v.text),
      (k) => visible[k].disabled,
      q,
      active,
    )
    if (i >= 0) setActive(i)
  }

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return
    if (open) {
      handleOpenKey(e, false)
      return
    }
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        openWith('selected')
        break
      case 'Home':
        openWith('first')
        break
      case 'End':
        openWith('last')
        break
      case 'Backspace':
      case 'Delete':
        if (!clearable || selected.length === 0) return
        clear()
        break
      default: {
        if (!isTypeaheadKey(e)) return
        if (searchable) {
          openWith('selected', e.key)
          break
        }
        const q = typeahead.push(e.key)
        const i = typeaheadIndex(
          entries.map((v) => v.text),
          (k) => entries[k].disabled,
          q,
          initialIndex(entries),
        )
        openWith('selected')
        if (i >= 0) setActive(i)
      }
    }
    e.preventDefault()
  }

  // Mouse opens on press (like a native select); touch / pen on click so a scroll gesture doesn't open it.
  // A click without a press on the trigger (its <label>) only focuses, as with native controls.
  const onTriggerPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e)
    pointer.current = e.pointerType
    if (e.defaultPrevented || disabled || e.button !== 0 || e.pointerType !== 'mouse') return
    e.preventDefault()
    triggerRef.current?.focus({ preventScroll: true })
    if (open) close()
    else openWith('selected')
  }
  const onTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    const type = pointer.current
    pointer.current = null
    if (e.defaultPrevented || disabled || type === 'mouse') return
    if (type === null) {
      triggerRef.current?.focus({ preventScroll: true })
      return
    }
    if (open) close()
    else openWith('selected')
  }

  // Focus the search field on open.
  useLayoutEffect(() => {
    if (open) searchEl?.focus({ preventScroll: true })
  }, [open, searchEl])

  // Keep the active option in view; centre the selection when the panel opens.
  const wasOpen = useRef(false)
  useLayoutEffect(() => {
    const list = listRef.current
    if (!open) {
      wasOpen.current = false
      return
    }
    if (!list) return
    const first = !wasOpen.current
    wasOpen.current = true
    const scroll = () => {
      const el = active >= 0 && visible[active] ? list.ownerDocument.getElementById(optId(visible[active])) : null
      if (!el) return
      const top = el.offsetTop
      const bottom = top + el.offsetHeight
      if (first) list.scrollTop = top - (list.clientHeight - el.offsetHeight) / 2
      else if (top < list.scrollTop) list.scrollTop = top
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
    }
    scroll()
    // The panel's max-height settles after the first positioning pass.
    if (first) {
      const raf = requestAnimationFrame(scroll)
      return () => cancelAnimationFrame(raf)
    }
  }, [open, active, visible, listMounted]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    setActive(initialIndex(filterBy(q)))
  }

  const activeEntry = open && active >= 0 ? visible[active] : undefined
  const labelledBy = ariaLabelledBy ?? f.labelId
  const hasValue = selectedEntries.length > 0
  const showClear = clearable && hasValue && !disabled

  const valueContent = (e: Entry<O>) =>
    renderValue ? (
      renderValue(e.opt)
    ) : (
      <>
        {e.opt.icon !== undefined && <span className="nui-selectbox__icon">{e.opt.icon}</span>}
        <span className="nui-selectbox__text">{e.opt.label}</span>
      </>
    )

  let display: ReactNode
  if (!hasValue) display = <span className="nui-selectbox__placeholder">{placeholder ?? m.selectPlaceholder}</span>
  else if (!multi) display = valueContent(selectedEntries[0])
  else if (selectedEntries.length <= maxChips)
    display = selectedEntries.map((e) => (
      <span key={e.opt.value} className="nui-selectbox__chip">
        {renderValue ? renderValue(e.opt) : e.opt.label}
      </span>
    ))
  else display = <span className="nui-selectbox__text">{m.nSelected.replace('{n}', String(selectedEntries.length))}</span>

  // Render list rows with group headings.
  const rows: ReactNode[] = []
  let currentGroup: string | undefined
  let groupRows: ReactNode[] = []
  const flush = () => {
    if (currentGroup === undefined) rows.push(...groupRows)
    else {
      const gid = `${uid}-grp-${rows.length}`
      rows.push(
        <div key={gid} role="group" aria-labelledby={gid} className="nui-listbox__group">
          <div id={gid} role="presentation" className="nui-listbox__group-label">
            {currentGroup}
          </div>
          {groupRows}
        </div>,
      )
    }
    groupRows = []
  }
  visible.forEach((e, i) => {
    if (i > 0 && e.group !== currentGroup) flush()
    currentGroup = e.group
    const sel = isSelected(e.opt.value)
    const act = i === active
    groupRows.push(
      <div
        key={e.opt.value}
        id={optId(e)}
        role="option"
        className="nui-listbox__option"
        aria-selected={sel}
        aria-disabled={e.disabled || undefined}
        data-active={act || undefined}
        onPointerMove={() => !e.disabled && active !== i && setActive(i)}
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={() => choose(e)}
      >
        {renderOption ? (
          <span className="nui-listbox__custom">{renderOption(e.opt, { selected: sel, active: act, disabled: e.disabled })}</span>
        ) : (
          <>
            {e.opt.icon !== undefined && <span className="nui-listbox__icon">{e.opt.icon}</span>}
            <span className="nui-listbox__text">
              <span className="nui-listbox__label">{e.opt.label}</span>
              {e.opt.description !== undefined && <span className="nui-listbox__desc">{e.opt.description}</span>}
            </span>
          </>
        )}
        <CheckIcon className="nui-listbox__check" />
      </div>,
    )
  })
  if (visible.length) flush()

  return (
    <div className={cx('nui-selectbox', className)} style={style} data-clearable={showClear || undefined}>
      <button
        ref={(node) => {
          triggerRef.current = node
          assignRef(ref, node)
        }}
        type="button"
        id={f.id}
        role="combobox"
        className="nui-selectbox__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={!searchable && activeEntry ? optId(activeEntry) : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : ariaLabelledBy}
        aria-describedby={f['aria-describedby']}
        aria-invalid={f['aria-invalid']}
        disabled={disabled}
        onKeyDown={onTriggerKeyDown}
        onPointerDown={onTriggerPointerDown}
        onClick={onTriggerClick}
        {...rest}
      >
        <span className="nui-selectbox__value" data-multiple={multi || undefined}>
          {display}
        </span>
        <ChevronIcon className="nui-selectbox__chevron" />
      </button>
      {showClear && (
        <button type="button" tabIndex={-1} className="nui-selectbox__clear" aria-label={m.clearSelection} onClick={clear}>
          <CloseIcon size={10} />
        </button>
      )}
      {name !== undefined &&
        (multi ? (
          selected.map((v) => <input key={v} type="hidden" name={name} value={v} />)
        ) : (
          <input type="hidden" name={name} value={selected[0] ?? ''} />
        ))}

      <FloatingPanel
        open={open}
        anchor={triggerRef}
        placement={placement}
        matchWidth="min"
        returnFocus={false}
        onDismiss={(reason) => close(reason === 'escape')}
        className={cx('nui-listbox', panelClassName)}
      >
        {searchable && (
          <div className="nui-listbox__search">
            <SearchIcon className="nui-listbox__search-icon" />
            <input
              ref={setSearchEl}
              type="text"
              role="combobox"
              className="nui-listbox__search-input"
              value={query}
              onChange={onSearchChange}
              onKeyDown={(e) => handleOpenKey(e, true)}
              placeholder={searchPlaceholder ?? m.searchPlaceholder}
              aria-label={searchPlaceholder ?? m.searchPlaceholder}
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeEntry ? optId(activeEntry) : undefined}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}
        <div
          ref={setList}
          id={listId}
          role="listbox"
          className="nui-listbox__list"
          aria-labelledby={ariaLabel ? undefined : labelledBy}
          aria-label={ariaLabel}
          aria-multiselectable={multi || undefined}
          tabIndex={-1}
        >
          {rows}
        </div>
        {visible.length === 0 && (
          <p className="nui-listbox__empty" role="status">
            {emptyText ?? m.noResults}
          </p>
        )}
      </FloatingPanel>
    </div>
  )
}
