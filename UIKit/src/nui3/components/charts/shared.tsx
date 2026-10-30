import { useCallback, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { niceTicks } from '../../utils/misc'

/** Series colour by index: chart-1 → chart-5, then wraps. */
export const seriesColor = (i: number) => `var(--nui-chart-${(i % 5) + 1})`

/** Stable, url()-safe id for <linearGradient> etc. */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Rough width of tabular 11px axis text, to size the y-axis gutter. */
export const textWidth = (s: string, px = 11) => s.length * px * 0.6

/** Container width via ResizeObserver (falls back to 600 before the first measure). */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width)
      setWidth((prev) => (prev === w ? prev : w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width || 600] as const
}

/**
 * Reading index shared by every chart: ←/→ (and Home/End) move it, blur and pointer-leave reset it,
 * pointer move maps x (relative to the container) to an index via `xToIndex`.
 * `live` is true while the reading was moved by keyboard, so tooltips announce only then.
 */
export function useReading(count: number, xToIndex?: (x: number) => number) {
  const [index, setIndex] = useState<number | null>(null)
  const [live, setLive] = useState(false)
  const mapRef = useRef(xToIndex)
  mapRef.current = xToIndex
  const current = index != null && index < count ? index : null

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (count <= 0) return
      let next: number | null = null
      if (e.key === 'ArrowRight') next = current == null ? 0 : Math.min(count - 1, current + 1)
      else if (e.key === 'ArrowLeft') next = current == null ? count - 1 : Math.max(0, current - 1)
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = count - 1
      else if (e.key === 'Escape') {
        setIndex(null)
        return
      }
      if (next == null) return
      e.preventDefault()
      setLive(true)
      setIndex(next)
    },
    [count, current],
  )
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const map = mapRef.current
      if (!map || count <= 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      const i = map(e.clientX - rect.left)
      setLive(false)
      setIndex(Number.isFinite(i) ? clamp(Math.round(i), 0, count - 1) : null)
    },
    [count],
  )
  const reset = useCallback(() => setIndex(null), [])
  return {
    index: current,
    setIndex: (i: number | null) => {
      setLive(false)
      setIndex(i)
    },
    live,
    handlers: { onKeyDown, onBlur: reset, onPointerMove, onPointerLeave: reset },
  }
}

/** Dashed-border empty state with the localized `chartEmpty` message. */
export function ChartEmpty({ height, className, style }: { height: number; className?: string; style?: CSSProperties }) {
  const { m } = useNuiLocale()
  return (
    <div className={cx('nui-chart', className)} style={style}>
      <div className="nui-chart__empty" role="status" style={{ height }}>
        {m.chartEmpty}
      </div>
    </div>
  )
}

/** Absolutely positioned HTML tooltip, centred on x and kept inside the container. */
export function ChartTip({ x, width, live, children }: { x: number; width: number; live: boolean; children: ReactNode }) {
  const left = width > 140 ? clamp(x, 64, width - 64) : width / 2
  return (
    <div className="nui-chart__tip" style={{ left }} aria-live={live ? 'polite' : 'off'}>
      {children}
    </div>
  )
}

export function TipRow({ color, label, value }: { color?: string; label: ReactNode; value: ReactNode }) {
  return (
    <div className="nui-chart__tip-row">
      {color ? <span className="nui-chart__swatch" style={{ background: color }} aria-hidden="true" /> : null}
      <span className="nui-chart__tip-label">{label}</span>
      <span className="nui-chart__tip-value">{value}</span>
    </div>
  )
}

/** Evenly spaced indices for `count` x-axis labels over n points (always includes first and last). */
export function xTickIndices(n: number, count: number): number[] {
  if (n <= 0) return []
  if (n === 1 || count <= 1) return [0]
  const k = Math.min(n, Math.max(2, count))
  const out = new Set<number>()
  for (let i = 0; i < k; i++) out.add(Math.round((i * (n - 1)) / (k - 1)))
  return [...out]
}

/** Default number formatter: compact-ish, max 2–4 significant decimals. */
export function useDefaultFormat() {
  const { number } = useNuiLocale()
  return useCallback(
    (v: number) => {
      const a = Math.abs(v)
      if (a >= 1e6) return number(v, { notation: 'compact', maximumFractionDigits: 2 })
      return number(v, { maximumFractionDigits: a >= 100 ? 0 : a >= 1 ? 2 : 4 })
    },
    [number],
  )
}

/** Horizontal grid lines + y tick labels. `side` puts labels left (anchor end at x0-8) or right (anchor start at x1+8). */
export function YGrid({
  ticks,
  y,
  x0,
  x1,
  format,
  side = 'left',
}: {
  ticks: number[]
  y: (v: number) => number
  x0: number
  x1: number
  format: (v: number) => string
  side?: 'left' | 'right'
}) {
  return (
    <g>
      {ticks.map((t) => {
        const yy = Math.round(y(t)) + 0.5
        return (
          <g key={t}>
            <line className="nui-chart__grid" x1={x0} x2={x1} y1={yy} y2={yy} />
            <text
              className="nui-chart__axis"
              x={side === 'left' ? x0 - 8 : x1 + 8}
              y={yy}
              dy="0.32em"
              textAnchor={side === 'left' ? 'end' : 'start'}
            >
              {format(t)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** X-axis labels; first is start-anchored and last end-anchored so they never clip. */
export function XLabels({ items, y }: { items: { x: number; label: string; edge?: 'start' | 'end' }[]; y: number }) {
  return (
    <g>
      {items.map((it, i) => (
        <text key={i} className="nui-chart__axis" x={it.x} y={y} textAnchor={it.edge ?? 'middle'}>
          {it.label}
        </text>
      ))}
    </g>
  )
}

/** Ticks for an axis: niceTicks over [lo, hi] unless fixed bounds are given (then clipped to them). */
export function axisDomain(values: number[], count: number, fixedMin?: number, fixedMax?: number) {
  const finite = values.filter(Number.isFinite)
  let lo = fixedMin ?? (finite.length ? Math.min(...finite) : 0)
  let hi = fixedMax ?? (finite.length ? Math.max(...finite) : 1)
  let ticks = niceTicks(lo, hi, count)
  if (fixedMin == null && ticks.length) lo = ticks[0]
  if (fixedMax == null && ticks.length) hi = ticks[ticks.length - 1]
  if (lo === hi) hi = lo + 1
  const eps = (hi - lo) * 1e-9
  ticks = ticks.filter((t) => t >= lo - eps && t <= hi + eps)
  return { lo, hi, ticks }
}

/** Cap the x-label count so labels of `maxLabel` chars keep ≥28px apart within `plotW`. */
export function fitTicks(want: number, plotW: number, maxLabelWidth: number) {
  return Math.max(2, Math.min(want, Math.floor(plotW / (maxLabelWidth + 28)) + 1))
}
