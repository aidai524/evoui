import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cx } from '../../utils/cx'
import { useFieldControl } from './Field'

function useMergedRef<T>(own: Ref<T> | undefined) {
  const inner = useRef<T | null>(null)
  const set = (node: T | null) => {
    inner.current = node
    if (typeof own === 'function') own(node)
    else if (own) (own as { current: T | null }).current = node
  }
  return [inner, set] as const
}

/* ───────────────────────── Input ───────────────────────── */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Monospace 14px for addresses and hashes. */
  mono?: boolean
  /** Force invalid styling + aria-invalid (also set automatically by Field error). */
  invalid?: boolean
  ref?: Ref<HTMLInputElement>
}

export function Input({ mono, invalid, className, id, disabled, 'aria-describedby': db, 'aria-invalid': ai, ref, ...rest }: InputProps) {
  const f = useFieldControl({ id, invalid, 'aria-describedby': db, 'aria-invalid': ai })
  return (
    <input
      ref={ref}
      id={f.id}
      className={cx('nui-input', mono && 'nui-input--mono', className)}
      aria-describedby={f['aria-describedby']}
      aria-invalid={f['aria-invalid']}
      disabled={disabled ?? f.disabled}
      {...rest}
    />
  )
}

/* ───────────────────────── Textarea ───────────────────────── */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean
  invalid?: boolean
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({ mono, invalid, className, id, disabled, 'aria-describedby': db, 'aria-invalid': ai, ref, ...rest }: TextareaProps) {
  const f = useFieldControl({ id, invalid, 'aria-describedby': db, 'aria-invalid': ai })
  return (
    <textarea
      ref={ref}
      id={f.id}
      className={cx('nui-textarea', mono && 'nui-textarea--mono', className)}
      aria-describedby={f['aria-describedby']}
      aria-invalid={f['aria-invalid']}
      disabled={disabled ?? f.disabled}
      {...rest}
    />
  )
}

/* ───────────────────────── NativeSelect ───────────────────────── */

export type NativeSelectOption = string | { value: string; label?: ReactNode; disabled?: boolean }

export interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Shorthand for `<option>` children. */
  options?: NativeSelectOption[]
  invalid?: boolean
  ref?: Ref<HTMLSelectElement>
}

/** Native `<select>` (OS picker on mobile, zero JS). Use `Select` when rows need icons, descriptions or search. */
export function NativeSelect({ options, invalid, className, id, disabled, children, 'aria-describedby': db, 'aria-invalid': ai, ref, ...rest }: NativeSelectProps) {
  const f = useFieldControl({ id, invalid, 'aria-describedby': db, 'aria-invalid': ai })
  return (
    <select
      ref={ref}
      id={f.id}
      className={cx('nui-select', className)}
      aria-describedby={f['aria-describedby']}
      aria-invalid={f['aria-invalid']}
      disabled={disabled ?? f.disabled}
      {...rest}
    >
      {options?.map((o) =>
        typeof o === 'string' ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label ?? o.value}
          </option>
        ),
      )}
      {children}
    </select>
  )
}

/* ───────────────────────── InputGroup ───────────────────────── */

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Leading decoration (unit, symbol, button). */
  start?: ReactNode
  /** Trailing decoration. */
  end?: ReactNode
  /** The `Input` (it loses its own border; the group draws it). */
  children?: ReactNode
}

/** Bordered row with start/end addons around one Input. Invalid/disabled/focus follow the inner input. */
export function InputGroup({ start, end, className, children, ...rest }: InputGroupProps) {
  return (
    <div className={cx('nui-input-group', className)} {...rest}>
      {start !== undefined && <span className="nui-input-group__addon">{start}</span>}
      {children}
      {end !== undefined && <span className="nui-input-group__addon">{end}</span>}
    </div>
  )
}

/* ───────────────────────── SearchInput ───────────────────────── */

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Required accessible name (aria-label). */
  label: string
  /** `/` focuses the input from anywhere on the page (default true). */
  shortcut?: boolean
  /** Called on Esc (after clearing). Controlled inputs should reset their value here. */
  onClear?: () => void
  ref?: Ref<HTMLInputElement>
}

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

export function SearchInput({ label, shortcut = true, onClear, onKeyDown, className, id, ref, ...rest }: SearchInputProps) {
  const [inner, setRef] = useMergedRef<HTMLInputElement>(ref)
  const f = useFieldControl({ id })

  useEffect(() => {
    if (!shortcut) return
    const on = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target)) return
      e.preventDefault()
      inner.current?.focus()
    }
    document.addEventListener('keydown', on)
    return () => document.removeEventListener('keydown', on)
  }, [shortcut, inner])

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || e.key !== 'Escape') return
    e.preventDefault()
    if (rest.value === undefined && inner.current) inner.current.value = ''
    onClear?.()
  }

  return (
    <div className={cx('nui-search', className)}>
      <input
        ref={setRef}
        id={f.id}
        type="search"
        className="nui-search__input"
        aria-label={label}
        aria-describedby={f['aria-describedby']}
        autoComplete="off"
        onKeyDown={handleKey}
        {...rest}
      />
      {shortcut && (
        <kbd className="nui-search__hint" aria-hidden="true">
          /
        </kbd>
      )}
    </div>
  )
}
