import { createContext, useContext, useId, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { normalize, onRovingKeyDown, rovingIndex, useSlidingIndicator, type Option } from './roving'

export type ChoiceOption<V extends string = string> = Option<V>

/* ───────────────────────── ChipGroup ───────────────────────── */

export interface ChipGroupProps<V extends string = string> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: ChoiceOption<V>[]
  value: V | undefined
  onChange: (value: V) => void
  /** Accessible group name (aria-label). */
  label: string
}

/** Filter chips: role=group + aria-pressed, roving tabindex, ←/→ move and select. */
export function ChipGroup<V extends string = string>({ options, value, onChange, label, className, ...rest }: ChipGroupProps<V>) {
  const items = options.map(normalize)
  const current = rovingIndex(items, value)
  return (
    <div
      role="group"
      aria-label={label}
      className={cx('nui-chips', className)}
      onKeyDown={(e) => onRovingKeyDown(e, items, current, (v) => onChange(v as V))}
      {...rest}
    >
      {items.map((it, i) => (
        <button
          key={it.value}
          type="button"
          data-roving=""
          className="nui-chip"
          aria-pressed={it.value === value}
          tabIndex={i === current ? 0 : -1}
          disabled={it.disabled}
          onClick={() => onChange(it.value)}
        >
          {it.label}
          {it.count !== undefined && <span className="nui-chip__count">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ───────────────────────── Tabs / TabPanel ───────────────────────── */

export interface TabItem<V extends string = string> {
  value: V
  label: ReactNode
  disabled?: boolean
}

interface TabsCtx {
  id: string
  value: string | undefined
}
const TabsContext = createContext<TabsCtx | null>(null)

export const tabId = (tabsId: string, value: string) => `${tabsId}-tab-${value}`
export const tabPanelId = (tabsId: string, value: string) => `${tabsId}-panel-${value}`

export interface TabsProps<V extends string = string> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: (TabItem<V> | V)[]
  value: V | undefined
  onChange: (value: V) => void
  /** Accessible name of the tablist. */
  label?: string
  /** Base id for tab/panel wiring; panels use `{id}-panel-{value}`. Generated when omitted. */
  id?: string
  /** `TabPanel` children rendered after the tablist; they pick up id + value from context. */
  children?: ReactNode
}

/** role=tablist/tab with roving tabindex; ←/→ move and select. */
export function Tabs<V extends string = string>({ items, value, onChange, label, id, className, children, ...rest }: TabsProps<V>) {
  const auto = useId()
  const tabsId = id ?? auto
  const list = items.map((it) => normalize(typeof it === 'string' ? it : { value: it.value, label: it.label, disabled: it.disabled }))
  const current = rovingIndex(list, value)
  const listRef = useRef<HTMLDivElement>(null)
  useSlidingIndicator(listRef, list.findIndex((it) => it.value === value), list.map((it) => it.value).join('\u0000'))
  const tablist = (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={cx('nui-tabs', className)}
      onKeyDown={(e) => onRovingKeyDown(e, list, current, (v) => onChange(v as V))}
      {...rest}
    >
      {list.map((it, i) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          data-roving=""
          id={tabId(tabsId, it.value)}
          className="nui-tab"
          aria-selected={it.value === value}
          aria-controls={tabPanelId(tabsId, it.value)}
          tabIndex={i === current ? 0 : -1}
          disabled={it.disabled}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
      <span className="nui-tabs__indicator" aria-hidden="true" />
    </div>
  )
  if (children === undefined) return tablist
  return (
    <TabsContext.Provider value={{ id: tabsId, value }}>
      {tablist}
      {children}
    </TabsContext.Provider>
  )
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  /** Needed only when the panel is not a child of `Tabs`: the `id` passed to Tabs. */
  tabsId?: string
  /** Needed only outside `Tabs`: whether this panel is active. */
  selected?: boolean
}

/** role=tabpanel; inactive panels are `hidden` but keep tabIndex=0. */
export function TabPanel({ value, tabsId, selected, className, children, ...rest }: TabPanelProps) {
  const ctx = useContext(TabsContext)
  const base = tabsId ?? ctx?.id ?? ''
  const active = selected ?? ctx?.value === value
  return (
    <div
      role="tabpanel"
      id={tabPanelId(base, value)}
      aria-labelledby={tabId(base, value)}
      tabIndex={0}
      hidden={!active}
      className={cx('nui-tab-panel', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

/* ───────────────────────── Segmented ───────────────────────── */

export interface SegmentedProps<V extends string = string> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: ChoiceOption<V>[]
  value: V | undefined
  onChange: (value: V) => void
  /** Accessible radiogroup name (aria-label). */
  label: string
  /** Stretch to full width with equal items. */
  block?: boolean
  disabled?: boolean
}

/** Mutually exclusive choice: role=radiogroup + radio/aria-checked, ←/→ move and select. */
export function Segmented<V extends string = string>({ options, value, onChange, label, block, disabled, className, ...rest }: SegmentedProps<V>) {
  const items = options.map(normalize).map((it) => ({ ...it, disabled: disabled || it.disabled }))
  const current = rovingIndex(items, value)
  const groupRef = useRef<HTMLDivElement>(null)
  useSlidingIndicator(groupRef, items.findIndex((it) => it.value === value), items.map((it) => it.value).join('\u0000'))
  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cx('nui-segmented', block && 'nui-segmented--block', className)}
      onKeyDown={(e) => onRovingKeyDown(e, items, current, (v) => onChange(v as V))}
      {...rest}
    >
      {items.map((it, i) => (
        <button
          key={it.value}
          type="button"
          role="radio"
          data-roving=""
          className="nui-segmented__item"
          aria-checked={it.value === value}
          tabIndex={i === current ? 0 : -1}
          disabled={it.disabled}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
      <span className="nui-segmented__indicator" aria-hidden="true" />
    </div>
  )
}
