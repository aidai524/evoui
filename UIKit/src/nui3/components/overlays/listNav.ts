// Pure list-navigation helpers shared by Select (listbox) and Menu (menu): index movement that skips
// disabled items, and first-letters type-ahead. Kept free of React so they are unit-testable.
import { useRef } from 'react'

export interface NavItem {
  disabled?: boolean
}

export type NavMove = number | 'first' | 'last'

/**
 * Next enabled index from `current` moving by `move` (±1 arrows, ±10 page keys, 'first' / 'last').
 * - `wrap` (menus) cycles past the ends; otherwise movement clamps (listbox, per APG).
 * - A jump larger than one (PageDown) lands on the nearest enabled item in the travel direction,
 *   falling back to the opposite direction near the end.
 * - `current < 0` (nothing active) treats +n as "from before the first" and −n as "from after the last".
 * Returns -1 when no item is enabled.
 */
export function moveIndex(items: readonly NavItem[], current: number, move: NavMove, wrap = false): number {
  const n = items.length
  const enabled = (i: number) => i >= 0 && i < n && !items[i].disabled
  const scan = (from: number, dir: 1 | -1) => {
    for (let i = from; i >= 0 && i < n; i += dir) if (enabled(i)) return i
    return -1
  }
  if (n === 0) return -1
  if (move === 'first') return scan(0, 1)
  if (move === 'last') return scan(n - 1, -1)
  if (move === 0) return enabled(current) ? current : scan(0, 1)
  const dir = move > 0 ? 1 : -1
  if (current < 0 || current >= n) return dir > 0 ? scan(0, 1) : scan(n - 1, -1)

  if (wrap && Math.abs(move) === 1) {
    for (let step = 1; step <= n; step++) {
      const i = (((current + dir * step) % n) + n) % n
      if (enabled(i)) return i
    }
    return -1
  }
  const target = Math.min(n - 1, Math.max(0, current + move))
  const hit = scan(target, dir)
  if (hit >= 0 && hit !== current) return hit
  const back = scan(target, dir > 0 ? -1 : 1)
  return back >= 0 ? back : current
}

const norm = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim()

/**
 * Type-ahead target for `query` (the keys typed in quick succession).
 * - Repeating one character ("aaa") cycles through items starting with it, beginning after `current`.
 * - Otherwise finds the first enabled item whose text starts with the query, searching from `current`
 *   (inclusive, so typing more letters keeps the match) and wrapping around.
 * Matching ignores case, accents and leading spaces. Returns -1 when nothing matches.
 */
export function typeaheadIndex(texts: readonly string[], disabled: readonly boolean[] | ((i: number) => boolean), query: string, current: number): number {
  const n = texts.length
  const q = norm(query)
  if (!q || n === 0) return -1
  const isDisabled = typeof disabled === 'function' ? disabled : (i: number) => Boolean(disabled[i])
  const repeated = [...q].every((c) => c === q[0])
  const needle = repeated ? q[0] : q
  const start = repeated || current < 0 ? current + 1 : current
  for (let k = 0; k < n; k++) {
    const i = (((start + k) % n) + n) % n
    if (!isDisabled(i) && norm(texts[i]).startsWith(needle)) return i
  }
  return -1
}

/** Is `key` a printable character that should feed type-ahead (no modifiers)? */
export function isTypeaheadKey(e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }): boolean {
  return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey
}

/**
 * Keystroke buffer for type-ahead: `push(char)` returns the accumulated query; it resets after `delay` ms
 * of silence. `pending()` tells whether a query is in progress (Space then belongs to the query, per APG).
 */
export function useTypeahead(delay = 500) {
  const buf = useRef({ text: '', timer: 0 })
  return {
    push(char: string) {
      const b = buf.current
      window.clearTimeout(b.timer)
      b.text += char
      b.timer = window.setTimeout(() => (b.text = ''), delay)
      return b.text
    },
    pending: () => buf.current.text.length > 0,
    reset() {
      window.clearTimeout(buf.current.timer)
      buf.current.text = ''
    },
  }
}
