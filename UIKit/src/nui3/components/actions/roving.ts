// Shared roving-tabindex keyboard handling for ChipGroup / Tabs / Segmented (03 §4).
import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react'

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

/* ───────────────────────── Sliding indicator ───────────────────────── */

function placeIndicator(el: HTMLElement, index: number, animate: boolean) {
  const item = index >= 0 ? el.querySelectorAll<HTMLElement>(':scope > [data-roving]')[index] : undefined
  if (!item) {
    el.removeAttribute('data-indicator')
    return
  }
  const snap = !animate || el.dataset.indicator !== 'ready'
  if (snap) el.dataset.indicator = 'static'
  // Sub-pixel rects (offset* round to integers), divided by any ancestor scale (e.g. a Dialog mid-enter).
  const c = el.getBoundingClientRect()
  const r = item.getBoundingClientRect()
  const scale = el.offsetWidth ? c.width / el.offsetWidth : 1
  const k = Math.abs(scale - 1) > 0.01 && scale > 0 ? scale : 1 // ignore offsetWidth's integer rounding
  el.style.setProperty('--nui-indicator-x', `${(r.left - c.left) / k - el.clientLeft + el.scrollLeft}px`)
  el.style.setProperty('--nui-indicator-y', `${(r.top - c.top) / k - el.clientTop + el.scrollTop}px`)
  el.style.setProperty('--nui-indicator-w', `${r.width / k}px`)
  el.style.setProperty('--nui-indicator-h', `${r.height / k}px`)
  if (snap) {
    void el.offsetWidth // commit the snapped position before transitions come back on
    el.dataset.indicator = 'ready'
  }
}

/**
 * Sliding selection indicator for Tabs / Segmented.
 * Measures the `[data-roving]` child at `index` (-1 = nothing selected) and writes
 * `--nui-indicator-x / -y / -w / -h` (px, relative to the container's padding box) on the container.
 * `data-indicator` on the container: absent until measured or when nothing is selected (CSS keeps a static
 * fallback), `"static"` while snapping, `"ready"` once transitions may run. First paint and container/item
 * resizes (viewport, web-font swap, i18n label change) snap; only a selection change animates.
 * Offsets are measured from the container's left edge in LTR and RTL alike, so CSS positions the indicator with
 * physical `left`; scrolled tab strips are accounted for (the indicator scrolls with the tabs).
 * Change `itemsKey` when the set of items changes so new nodes are observed.
 */
export function useSlidingIndicator(ref: RefObject<HTMLElement | null>, index: number, itemsKey = '') {
  const latest = useRef(index)

  useLayoutEffect(() => {
    latest.current = index
    if (ref.current) placeIndicator(ref.current, index, true)
  }, [ref, index, itemsKey])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => placeIndicator(el, latest.current, false))
    ro.observe(el)
    el.querySelectorAll(':scope > [data-roving]').forEach((n) => ro.observe(n))
    return () => ro.disconnect()
  }, [ref, itemsKey])
}
