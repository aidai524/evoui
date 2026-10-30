// Shared roving-tabindex keyboard handling for ChipGroup / Tabs / Segmented (03 §4).
import type { KeyboardEvent, ReactNode } from 'react'

export interface RovingItem {
  value: string
  disabled?: boolean
}

/** Index that owns tabIndex=0: the selected item, else the first enabled one. */
export function rovingIndex(items: RovingItem[], value: string | undefined): number {
  const i = items.findIndex((it) => it.value === value && !it.disabled)
  return i >= 0 ? i : items.findIndex((it) => !it.disabled)
}

/**
 * ←/→ (and ↑/↓, Home/End) move focus to the next enabled item and select it.
 * Items are found as `[data-roving]` children of the container.
 */
export function onRovingKeyDown(
  e: KeyboardEvent<HTMLElement>,
  items: RovingItem[],
  current: number,
  select: (value: string) => void,
) {
  const keys: Record<string, number | 'home' | 'end'> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'home', End: 'end' }
  const k = keys[e.key]
  if (k === undefined || items.length === 0) return
  e.preventDefault()
  const n = items.length
  let next = current
  if (k === 'home' || k === 'end') {
    const order = k === 'home' ? items.map((_, i) => i) : items.map((_, i) => n - 1 - i)
    next = order.find((i) => !items[i].disabled) ?? current
  } else {
    for (let step = 1; step <= n; step++) {
      const i = (((current + k * step) % n) + n) % n
      if (!items[i].disabled) {
        next = i
        break
      }
    }
  }
  const nodes = e.currentTarget.querySelectorAll<HTMLElement>('[data-roving]')
  nodes[next]?.focus()
  select(items[next].value)
}

export type Option<V extends string = string> = V | { value: V; label?: ReactNode; disabled?: boolean; count?: number }

export function normalize<V extends string>(o: Option<V>): { value: V; label: ReactNode; disabled?: boolean; count?: number } {
  return typeof o === 'string' ? { value: o, label: o } : { ...o, label: o.label ?? o.value }
}
