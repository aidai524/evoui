// Calendar (inline month grid), DatePicker (typed entry + popover) and DateRangePicker (two months + presets).
// Values are ISO calendar dates `YYYY-MM-DD` (see utils/date.ts): no Date objects cross the API, so there are
// no time-zone shifts. Keyboard follows the WAI-ARIA date-grid pattern with a roving tabindex.
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type KeyboardEvent,
  type Ref,
} from 'react'
import { useNuiLocale } from '../../i18n'
import { Button } from '../actions'
import { CalendarIcon, ChevronIcon, CloseIcon } from '../../icons'
import { cx } from '../../utils/cx'
import {
  addDays,
  addMonths,
  addYears,
  clampISODate,
  endOfMonth,
  endOfWeek,
  formatISODate,
  formatISODateRange,
  formatMonthYear,
  isInRange,
  isSameMonth,
  isValidISODate,
  isWithin,
  monthMatrix,
  monthNames,
  orderRange,
  parseDateInput,
  parseTimeInput,
  splitDateTime,
  startOfMonth,
  startOfWeek,
  todayISO,
  weekStartForLocale,
  weekdayNames,
  defaultDatePresets,
  type DateRange,
  type DateRangePreset,
  type ISODate,
  type WeekDay,
} from '../../utils/date'
import { FloatingPanel, type Placement } from '../overlays/floating'
import { useFieldControl } from './Field'

/* ───────────────────────── shared helpers ───────────────────────── */

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? value : inner
  const set = (v: T) => {
    if (!controlled) setInner(v)
    onChange?.(v)
  }
  return [current, set] as const
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => matchMedia(query).matches,
    () => false,
  )
}

const Chevron = ({ dir }: { dir: 'prev' | 'next' }) => (
  <ChevronIcon className={cx('nui-calendar__chev', dir === 'prev' ? 'nui-calendar__chev--prev' : 'nui-calendar__chev--next')} />
)

type Dir = 'prev' | 'next' | null
type View = 'days' | 'months' | 'years'

/* ───────────────────────── Calendar ───────────────────────── */

interface CalendarBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Earliest selectable date (ISO). */
  min?: ISODate
  /** Latest selectable date (ISO). */
  max?: ISODate
  /** Extra per-day rule, e.g. weekends. Disabled days stay focusable but cannot be chosen. */
  isDateDisabled?: (date: ISODate) => boolean
  /** 0 = Sunday … 6 = Saturday. Default from the locale (en-US Sunday, zh-CN Monday). */
  weekStartsOn?: WeekDay
  /** Months shown side by side (default 1). */
  months?: 1 | 2
  /** Any day of the month to show first when nothing is selected. */
  defaultMonth?: ISODate
  /** Called with the first day of the (first) visible month after navigation. */
  onMonthChange?: (month: ISODate) => void
  /** Override "today" (demos, tests). Default: the host's local date. */
  today?: ISODate
  /** Move focus into the grid on mount (pickers do this when opened from the keyboard). */
  autoFocus?: boolean
}

export interface CalendarSingleProps extends CalendarBaseProps {
  mode?: 'single'
  value?: ISODate | null
  defaultValue?: ISODate | null
  onChange?: (date: ISODate) => void
}

export interface CalendarRangeProps extends CalendarBaseProps {
  mode: 'range'
  value?: DateRange | null
  defaultValue?: DateRange | null
  /** Fires once both ends are chosen (second click), always ordered start ≤ end. */
  onChange?: (range: { start: ISODate; end: ISODate }) => void
  /** Fires on the first click of a new range. */
  onRangeStart?: (start: ISODate) => void
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps

/** Inline month grid. Single date or range; month → year quick switch from the title. */
export function Calendar(props: CalendarProps) {
  const {
    mode = 'single',
    value: valueProp,
    defaultValue,
    onChange,
    min,
    max,
    isDateDisabled,
    weekStartsOn: wsProp,
    months = 1,
    defaultMonth,
    onMonthChange,
    today: todayProp,
    autoFocus,
    className,
    onKeyDown,
    onRangeStart,
    ...rest
  } = props as CalendarBaseProps & {
    mode?: 'single' | 'range'
    value?: ISODate | DateRange | null
    defaultValue?: ISODate | DateRange | null
    onChange?: (v: never) => void
    onRangeStart?: (start: ISODate) => void
  }
  const range = mode === 'range'
  const { m, locale, isZh } = useNuiLocale()
  const weekStartsOn = wsProp ?? weekStartForLocale(locale)
  const today = useMemo(() => todayProp ?? todayISO(), [todayProp])
  const uid = useId()

  const [value, setValue] = useControllable<ISODate | DateRange | null>(valueProp, defaultValue ?? null)
  const single = !range && typeof value === 'string' && isValidISODate(value) ? value : null
  const rangeValue = range && value && typeof value === 'object' ? value : null

  const [pending, setPending] = useState<ISODate | null>(null)
  const [hover, setHover] = useState<ISODate | null>(null)
  const anchor = single ?? rangeValue?.start ?? null

  const initial = clampISODate(anchor ?? defaultMonth ?? today, min, max)
  const [focused, setFocused] = useState<ISODate>(initial)
  const [month, setMonthState] = useState<ISODate>(startOfMonth(initial))
  const [dir, setDir] = useState<Dir>(null)
  const [view, setView] = useState<View>('days')
  const rootRef = useRef<HTMLDivElement>(null)
  const focusRequest = useRef(Boolean(autoFocus))

  const visible = Array.from({ length: months }, (_, i) => addMonths(month, i))
  const lastVisible = visible[visible.length - 1]
  const isVisible = (d: ISODate) => d >= month && d <= endOfMonth(lastVisible)

  const setMonth = (next: ISODate, d: Dir) => {
    const first = startOfMonth(next)
    if (first === month) return
    setDir(d ?? (first > month ? 'next' : 'prev'))
    setMonthState(first)
    onMonthChange?.(first)
  }

  // Follow the selection when it changes from outside (typed entry, presets).
  const [prevAnchor, setPrevAnchor] = useState(anchor)
  if (anchor !== prevAnchor) {
    setPrevAnchor(anchor)
    if (anchor) {
      setFocused(anchor)
      if (!isVisible(anchor)) {
        const first = startOfMonth(anchor)
        setDir(first > month ? 'next' : 'prev')
        setMonthState(first)
      }
    }
  }

  const disabled = (d: ISODate) => !isWithin(d, min, max) || Boolean(isDateDisabled?.(d))

  const moveFocus = (target: ISODate) => {
    const next = clampISODate(target, min, max)
    setFocused(next)
    if (pending) setHover(next)
    if (next < month) setMonth(next, 'prev')
    else if (next > endOfMonth(lastVisible)) setMonth(addMonths(startOfMonth(next), -(months - 1)), 'next')
    focusRequest.current = true
  }

  const goMonth = (delta: number) => {
    setMonth(addMonths(month, delta), delta > 0 ? 'next' : 'prev')
    const f = clampISODate(addMonths(focused, delta), min, max)
    setFocused(f)
  }

  const select = (d: ISODate) => {
    if (disabled(d)) return
    if (!range) {
      setValue(d)
      ;(onChange as ((v: ISODate) => void) | undefined)?.(d)
      return
    }
    if (!pending) {
      setPending(d)
      setHover(d)
      onRangeStart?.(d)
      return
    }
    const r = orderRange(pending, d)
    setPending(null)
    setHover(null)
    setValue(r)
    ;(onChange as ((v: { start: ISODate; end: ISODate }) => void) | undefined)?.(r)
  }

  useLayoutEffect(() => {
    if (!focusRequest.current || view !== 'days') return
    focusRequest.current = false
    rootRef.current?.querySelector<HTMLElement>('.nui-calendar__day[tabindex="0"]')?.focus({ preventScroll: true })
  })

  const onGridKey = (e: KeyboardEvent<HTMLTableElement>) => {
    const k = e.key
    let next: ISODate | null = null
    if (k === 'ArrowLeft') next = addDays(focused, -1)
    else if (k === 'ArrowRight') next = addDays(focused, 1)
    else if (k === 'ArrowUp') next = addDays(focused, -7)
    else if (k === 'ArrowDown') next = addDays(focused, 7)
    else if (k === 'Home') next = startOfWeek(focused, weekStartsOn)
    else if (k === 'End') next = endOfWeek(focused, weekStartsOn)
    else if (k === 'PageUp') next = e.shiftKey ? addYears(focused, -1) : addMonths(focused, -1)
    else if (k === 'PageDown') next = e.shiftKey ? addYears(focused, 1) : addMonths(focused, 1)
    else if (k === 'Enter' || k === ' ') {
      e.preventDefault()
      select(focused)
      return
    }
    if (next) {
      e.preventDefault()
      moveFocus(next)
    }
  }

  const onRootKey = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.key === 'Escape' && view !== 'days') {
      // Back to the day grid instead of closing a surrounding popover.
      e.preventDefault()
      e.stopPropagation()
      setView('days')
      focusRequest.current = true
    } else if (e.key === 'Escape' && pending) {
      e.preventDefault()
      e.stopPropagation()
      setPending(null)
      setHover(null)
    }
  }

  // What the grid shows as start / end (live preview while the second end is being chosen).
  const shown = pending ? orderRange(pending, hover ?? pending) : rangeValue
  const prevDisabled = Boolean(min && endOfMonth(addMonths(month, -1)) < min)
  const nextDisabled = Boolean(max && startOfMonth(addMonths(lastVisible, 1)) > max)
  const weekdaysShort = weekdayNames(locale, weekStartsOn, isZh ? 'narrow' : 'short')
  const weekdaysLong = weekdayNames(locale, weekStartsOn, 'long')
  const live = visible.map((v) => formatMonthYear(v, locale)).join(' – ')

  const [pickerOffset, setPickerOffset] = useState(0)
  const openMonths = (i: number) => {
    setPickerOffset(i)
    setView('months')
  }

  return (
    <div
      ref={rootRef}
      className={cx('nui-calendar', className)}
      data-months={months}
      data-range={range || undefined}
      onKeyDown={onRootKey}
      {...rest}
    >
      <div className="nui-sr-only" aria-live="polite" aria-atomic="true">
        {view === 'days' ? live : ''}
      </div>
      {view === 'days' ? (
        <div className="nui-calendar__months" key="days" data-view="days">
          {visible.map((vm, i) => {
            const captionId = `${uid}-cap-${i}`
            return (
              <div className="nui-calendar__month" key={i}>
                <div className="nui-calendar__head">
                  {i === 0 ? (
                    <button type="button" className="nui-calendar__nav" aria-label={m.previousMonth} title={m.previousMonth} disabled={prevDisabled} onClick={() => goMonth(-1)}>
                      <Chevron dir="prev" />
                    </button>
                  ) : (
                    <span className="nui-calendar__nav-gap" />
                  )}
                  <button
                    type="button"
                    className="nui-calendar__title"
                    id={captionId}
                    aria-label={`${formatMonthYear(vm, locale)}, ${m.chooseMonth}`}
                    onClick={() => openMonths(i)}
                  >
                    <span key={vm} className="nui-calendar__title-text" data-dir={dir ?? undefined}>
                      {formatMonthYear(vm, locale)}
                    </span>
                    <ChevronIcon className="nui-calendar__title-chev" />
                  </button>
                  {i === visible.length - 1 ? (
                    <button type="button" className="nui-calendar__nav" aria-label={m.nextMonth} title={m.nextMonth} disabled={nextDisabled} onClick={() => goMonth(1)}>
                      <Chevron dir="next" />
                    </button>
                  ) : (
                    <span className="nui-calendar__nav-gap" />
                  )}
                </div>
                <div className="nui-calendar__clip">
                  <table
                    key={vm}
                    role="grid"
                    className="nui-calendar__grid"
                    aria-labelledby={captionId}
                    data-dir={dir ?? undefined}
                    onKeyDown={onGridKey}
                    onPointerLeave={() => pending && setHover(null)}
                  >
                    <thead>
                      <tr>
                        {weekdaysShort.map((w, j) => (
                          <th key={j} scope="col" abbr={weekdaysLong[j]} className="nui-calendar__weekday">
                            {w}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthMatrix(vm, weekStartsOn).map((week) => (
                        <tr key={week[0]}>
                          {week.map((d) => {
                            const outside = !isSameMonth(d, vm)
                            if (outside && months > 1) return <td key={d} role="gridcell" className="nui-calendar__cell" />
                            const isStart = range && shown?.start === d
                            const isEnd = range && shown?.end === d
                            const inRange = range && isInRange(d, shown?.start, shown?.end)
                            const selected = range ? inRange : single === d
                            const off = disabled(d)
                            return (
                              <td key={d} role="gridcell" className="nui-calendar__cell" aria-selected={selected}>
                                <button
                                  type="button"
                                  className="nui-calendar__day"
                                  data-date={d}
                                  tabIndex={d === focused && !outside ? 0 : -1}
                                  aria-label={formatISODate(d, locale, { dateStyle: 'full' })}
                                  aria-current={d === today ? 'date' : undefined}
                                  aria-disabled={off || undefined}
                                  data-outside={outside || undefined}
                                  data-today={d === today || undefined}
                                  data-selected={(!range && selected) || undefined}
                                  data-range-start={isStart || undefined}
                                  data-range-end={isEnd || undefined}
                                  data-in-range={(inRange && !isStart && !isEnd) || undefined}
                                  data-preview={(pending && inRange) || undefined}
                                  onClick={() => {
                                    if (off) return
                                    if (outside) moveFocus(d)
                                    else {
                                      setFocused(d)
                                      focusRequest.current = true
                                    }
                                    select(d)
                                  }}
                                  onPointerEnter={() => pending && setHover(d)}
                                >
                                  {Number(d.slice(8))}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <QuickPicker
          key={view}
          view={view}
          month={addMonths(month, pickerOffset)}
          min={min}
          max={max}
          today={today}
          onView={setView}
          onPick={(picked) => {
            setMonth(addMonths(picked, -pickerOffset), null)
            // Same day of month in the picked month (clamped to its length and to min/max).
            const day = Math.min(Number(focused.slice(8)), Number(endOfMonth(picked).slice(8)))
            setFocused(clampISODate(`${picked.slice(0, 8)}${String(day).padStart(2, '0')}`, min, max))
            setView('days')
            focusRequest.current = true
          }}
        />
      )}
    </div>
  )
}

/* ───────────────────────── month / year quick switch ───────────────────────── */

interface QuickPickerProps {
  view: 'months' | 'years'
  /** First day of the month the switch started from. */
  month: ISODate
  min?: ISODate
  max?: ISODate
  today: ISODate
  onView: (v: View) => void
  /** First day of the chosen month. */
  onPick: (month: ISODate) => void
}

function QuickPicker({ view, month, min, max, today, onView, onPick }: QuickPickerProps) {
  const { m, locale } = useNuiLocale()
  const year = Number(month.slice(0, 4))
  const [shownYear, setShownYear] = useState(year)
  const [dir, setDir] = useState<Dir>(null)
  const pad = (n: number) => String(n).padStart(2, '0')
  const minY = min ? Number(min.slice(0, 4)) : 1
  const maxY = max ? Number(max.slice(0, 4)) : 9999

  const blockStart = Math.floor((shownYear - 1) / 12) * 12 + 1 // 2017–2028 style blocks of 12
  const items =
    view === 'months'
      ? monthNames(locale, 'short').map((label, i) => {
          const first = `${String(shownYear).padStart(4, '0')}-${pad(i + 1)}-01`
          return {
            key: first,
            label,
            disabled: Boolean((min && endOfMonth(first) < min) || (max && first > max)),
            selected: first === month,
            current: first.slice(0, 7) === today.slice(0, 7),
          }
        })
      : Array.from({ length: 12 }, (_, i) => {
          const y = blockStart + i
          return {
            key: String(y),
            label: formatISODate(`${String(y).padStart(4, '0')}-06-15`, locale, { year: 'numeric' }),
            disabled: y < minY || y > maxY,
            selected: y === shownYear,
            current: y === Number(today.slice(0, 4)),
          }
        })
  const initialIndex = Math.max(
    0,
    items.findIndex((it) => it.selected),
  )
  const [focusIdx, setFocusIdx] = useState(initialIndex)
  const gridRef = useRef<HTMLDivElement>(null)
  const wantFocus = useRef(true)

  useLayoutEffect(() => {
    if (!wantFocus.current) return
    wantFocus.current = false
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true })
  })

  const step = view === 'months' ? 1 : 12
  const page = (delta: number) => {
    setDir(delta > 0 ? 'next' : 'prev')
    setShownYear((y) => Math.min(9999, Math.max(1, y + delta * step)))
  }

  const choose = (i: number) => {
    const it = items[i]
    if (it.disabled) return
    if (view === 'months') onPick(it.key)
    else {
      setShownYear(Number(it.key))
      onView('months')
    }
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key]
    if (delta !== undefined) {
      e.preventDefault()
      let n = focusIdx + delta
      if (n < 0 || n > 11) {
        page(n < 0 ? -1 : 1)
        n = (n + 12) % 12
      }
      setFocusIdx(n)
      wantFocus.current = true
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setFocusIdx(e.key === 'Home' ? 0 : 11)
      wantFocus.current = true
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault()
      page(e.key === 'PageUp' ? -1 : 1)
      wantFocus.current = true
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(focusIdx)
    }
  }

  const title =
    view === 'months'
      ? formatISODate(`${String(shownYear).padStart(4, '0')}-06-15`, locale, { year: 'numeric' })
      : `${items[0].label} – ${items[11].label}`
  const prevLabel = view === 'months' ? m.previousYear : m.previousYears
  const nextLabel = view === 'months' ? m.nextYear : m.nextYears

  return (
    <div className="nui-calendar__picker" data-view={view}>
      <div className="nui-calendar__head">
        <button type="button" className="nui-calendar__nav" aria-label={prevLabel} title={prevLabel} disabled={blockStart <= minY && view === 'years'} onClick={() => page(-1)}>
          <Chevron dir="prev" />
        </button>
        {view === 'months' ? (
          <button type="button" className="nui-calendar__title" aria-label={`${title}, ${m.chooseYear}`} onClick={() => onView('years')}>
            <span className="nui-calendar__title-text">{title}</span>
            <ChevronIcon className="nui-calendar__title-chev" />
          </button>
        ) : (
          <span className="nui-calendar__title" aria-live="polite">
            <span className="nui-calendar__title-text">{title}</span>
          </span>
        )}
        <button type="button" className="nui-calendar__nav" aria-label={nextLabel} title={nextLabel} disabled={blockStart + 11 >= maxY && view === 'years'} onClick={() => page(1)}>
          <Chevron dir="next" />
        </button>
      </div>
      <div className="nui-calendar__clip">
        <div
          ref={gridRef}
          key={view === 'months' ? shownYear : blockStart}
          className="nui-calendar__options"
          role="grid"
          aria-label={view === 'months' ? m.chooseMonth : m.chooseYear}
          data-dir={dir ?? undefined}
          onKeyDown={onKey}
        >
          {[0, 1, 2, 3].map((r) => (
            <div role="row" key={r} className="nui-calendar__options-row">
              {items.slice(r * 3, r * 3 + 3).map((it, c) => {
                const i = r * 3 + c
                return (
                  <span role="gridcell" key={it.key} aria-selected={it.selected}>
                    <button
                      type="button"
                      className="nui-calendar__option"
                      tabIndex={i === focusIdx ? 0 : -1}
                      aria-disabled={it.disabled || undefined}
                      aria-current={it.current ? (view === 'months' ? 'date' : 'true') : undefined}
                      data-selected={it.selected || undefined}
                      data-today={it.current || undefined}
                      onClick={() => {
                        setFocusIdx(i)
                        choose(i)
                      }}
                    >
                      {it.label}
                    </button>
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── trigger pieces ───────────────────────── */

/** Tab out of the first/last control in the panel: close and hand focus back to the trigger so Tab continues in page order. */
function useTabOut(onLeave: () => void) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]')].filter(
      (el) => el.tabIndex >= 0,
    )
    const first = items[0]
    const last = items[items.length - 1]
    if ((e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last)) onLeave()
  }
}

/* ───────────────────────── DatePicker ───────────────────────── */

export interface DatePickerProps {
  /** ISO date `YYYY-MM-DD` (or `YYYY-MM-DDTHH:mm` with `withTime`); null = empty. */
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  min?: ISODate
  max?: ISODate
  isDateDisabled?: (date: ISODate) => boolean
  weekStartsOn?: WeekDay
  /** Placeholder; default `YYYY-MM-DD` (zh `年-月-日`). */
  placeholder?: string
  /** Show the × button when there is a value (default true). */
  clearable?: boolean
  /** Add an HH:mm row; the value becomes `YYYY-MM-DDTHH:mm` (local wall-clock, no zone). */
  withTime?: boolean
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  /** Renders `<input type="hidden" name value=ISO>` for native forms. */
  name?: string
  id?: string
  className?: string
  placement?: Placement
  /** Override "today" (demos, tests). */
  today?: ISODate
  onOpenChange?: (open: boolean) => void
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-label'?: string
  /** The text input. */
  ref?: Ref<HTMLInputElement>
}

/** Input-like trigger with typed entry (validated on blur / Enter) and a Calendar popover. */
export function DatePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  placeholder,
  clearable = true,
  withTime,
  disabled: disabledProp,
  invalid,
  required,
  name,
  id,
  className,
  placement = 'bottom-start',
  today,
  onOpenChange,
  'aria-describedby': db,
  'aria-invalid': ai,
  'aria-label': ariaLabel,
  ref,
}: DatePickerProps) {
  const { m, locale } = useNuiLocale()
  const f = useFieldControl({ id, invalid, 'aria-describedby': db, 'aria-invalid': ai })
  const disabled = disabledProp ?? f.disabled
  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, onChange)
  const { date, time } = splitDateTime(value)
  const [open, setOpenState] = useState(false)
  const [focusCalendar, setFocusCalendar] = useState(false)
  // Bumped on every open: the Calendar remounts fresh (day view, focus) even if reopened mid exit-animation.
  const [openSeq, setOpenSeq] = useState(0)
  const [draft, setDraft] = useState<string | null>(null)
  const [typedInvalid, setTypedInvalid] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const setOpen = (o: boolean, focusCal = false) => {
    if (o === open) return
    setFocusCalendar(focusCal)
    if (o) setOpenSeq((n) => n + 1)
    setOpenState(o)
    onOpenChange?.(o)
  }

  const allowed = (d: ISODate) => isWithin(d, min, max) && !isDateDisabled?.(d)
  const display = date ? formatISODate(date, locale) + (withTime && time ? ` ${time}` : '') : ''
  const text = draft ?? display

  /** Parse typed text → value (or null for empty), undefined when invalid. */
  const parse = (s: string): string | null | undefined => {
    const t = s.trim()
    if (!t) return null
    let datePart = t
    let timePart: string | null = null
    if (withTime) {
      const mt = /^(.*?)[\sT,]+(\d{1,2}:?\d{2})$/.exec(t)
      if (mt) {
        datePart = mt[1]
        timePart = parseTimeInput(mt[2])
        if (!timePart) return undefined
      }
    }
    const d = parseDateInput(datePart, locale)
    if (!d || !allowed(d)) return undefined
    return withTime ? `${d}T${timePart ?? time ?? '00:00'}` : d
  }

  const commit = (): boolean => {
    if (draft === null) return true
    const v = parse(draft)
    if (v === undefined) {
      setTypedInvalid(true)
      return false
    }
    setDraft(null)
    setTypedInvalid(false)
    if (v !== value) setValue(v)
    return true
  }

  const pickDate = (d: ISODate) => {
    setDraft(null)
    setTypedInvalid(false)
    if (withTime) {
      setValue(`${d}T${time ?? '00:00'}`)
      return
    }
    setValue(d)
    setOpen(false)
    inputRef.current?.focus()
  }

  const draftDate = draft !== null ? parse(draft) : undefined
  const calendarValue = (draftDate ? splitDateTime(draftDate).date : null) ?? date
  const isInvalid = f.invalid || typedInvalid
  const onPanelKey = useTabOut(() => {
    setOpen(false)
    toggleRef.current?.focus()
  })

  return (
    <>
      <div
        ref={anchorRef}
        className={cx('nui-datepicker', className)}
        data-invalid={isInvalid || undefined}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
      >
        <input
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as { current: HTMLInputElement | null }).current = node
          }}
          id={f.id}
          className="nui-datepicker__input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={text}
          placeholder={placeholder ?? m.datePlaceholder}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          aria-describedby={f['aria-describedby']}
          aria-invalid={isInvalid || undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onChange={(e) => {
            setDraft(e.target.value)
            setTypedInvalid(false)
          }}
          onClick={() => setOpen(true)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (commit()) setOpen(false)
            } else if (e.key === 'ArrowDown' && (e.altKey || !open || draft === null)) {
              e.preventDefault()
              commit()
              if (open) {
                setFocusCalendar(true)
                anchorRef.current?.ownerDocument
                  .getElementById(panelId)
                  ?.querySelector<HTMLElement>('.nui-calendar__day[tabindex="0"]')
                  ?.focus()
              } else setOpen(true, true)
            } else if (e.key === 'Escape' && !open && draft !== null) {
              setDraft(null)
              setTypedInvalid(false)
            }
          }}
        />
        {clearable && value && !disabled && (
          <button
            type="button"
            className="nui-datepicker__clear"
            aria-label={m.clearDate}
            title={m.clearDate}
            onClick={() => {
              setDraft(null)
              setTypedInvalid(false)
              setValue(null)
              inputRef.current?.focus()
            }}
          >
            <CloseIcon />
          </button>
        )}
        <button
          ref={toggleRef}
          type="button"
          className="nui-datepicker__toggle"
          aria-label={m.chooseDate}
          title={m.chooseDate}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen(!open, true)}
        >
          <CalendarIcon />
        </button>
        {name && <input type="hidden" name={name} value={value ?? ''} />}
      </div>
      <FloatingPanel
        open={open}
        anchor={anchorRef}
        placement={placement}
        returnFocus={false}
        onDismiss={(reason) => {
          setOpen(false)
          if (reason === 'escape') inputRef.current?.focus()
        }}
        id={panelId}
        role="dialog"
        aria-label={m.chooseDate}
        className="nui-datepicker__panel"
        onKeyDown={onPanelKey}
      >
        <Calendar
          key={openSeq}
          value={calendarValue}
          onChange={pickDate}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          weekStartsOn={weekStartsOn}
          today={today}
          autoFocus={focusCalendar}
        />
        {withTime && (
          <TimeRow
            time={time}
            onTime={(t) => {
              const d = date ?? clampISODate(today ?? todayISO(), min, max)
              setDraft(null)
              setTypedInvalid(false)
              setValue(`${d}T${t}`)
            }}
          />
        )}
        <div className="nui-datepicker__foot">
          <Button variant="underline" size="sm" disabled={!allowed(today ?? todayISO())} onClick={() => pickDate(today ?? todayISO())}>
            {m.today}
          </Button>
          {clearable && value && (
            <Button
              variant="underline"
              size="sm"
              onClick={() => {
                setDraft(null)
                setTypedInvalid(false)
                setValue(null)
                setOpen(false)
                inputRef.current?.focus()
              }}
            >
              {m.clear}
            </Button>
          )}
        </div>
      </FloatingPanel>
    </>
  )
}

function TimeRow({ time, onTime }: { time: string | null; onTime: (t: string) => void }) {
  const { m } = useNuiLocale()
  const timeId = useId()
  return (
    <div className="nui-datepicker__time">
      <label className="nui-datepicker__time-label" htmlFor={timeId}>
        {m.time}
      </label>
      <input
        id={timeId}
        className="nui-input nui-datepicker__time-input"
        type="time"
        step={60}
        value={time ?? ''}
        onChange={(e) => {
          const t = parseTimeInput(e.target.value)
          if (t) onTime(t)
        }}
      />
    </div>
  )
}

/* ───────────────────────── DateRangePicker ───────────────────────── */

export interface DateRangePickerProps {
  value?: DateRange | null
  defaultValue?: DateRange | null
  onChange?: (range: DateRange | null) => void
  min?: ISODate
  max?: ISODate
  isDateDisabled?: (date: ISODate) => boolean
  weekStartsOn?: WeekDay
  /** Shortcut column. Default: Today, Last 7 days, Last 30 days, This month. `false` hides it. */
  presets?: DateRangePreset[] | false
  /** Months side by side; default 2 on screens ≥ 720px, 1 below. */
  months?: 1 | 2
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  invalid?: boolean
  /** Renders `<input type="hidden" name value="start/end">` (ISO 8601 interval). */
  name?: string
  id?: string
  className?: string
  placement?: Placement
  today?: ISODate
  onOpenChange?: (open: boolean) => void
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-label'?: string
  ref?: Ref<HTMLButtonElement>
}

/** Range trigger + popover with presets and one/two months. Second click applies and closes. */
export function DateRangePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  presets,
  months: monthsProp,
  placeholder,
  clearable = true,
  disabled: disabledProp,
  invalid,
  name,
  id,
  className,
  placement = 'bottom-start',
  today: todayProp,
  onOpenChange,
  'aria-describedby': db,
  'aria-invalid': ai,
  'aria-label': ariaLabel,
  ref,
}: DateRangePickerProps) {
  const { m, locale } = useNuiLocale()
  const f = useFieldControl({ id, invalid, 'aria-describedby': db, 'aria-invalid': ai })
  const disabled = disabledProp ?? f.disabled
  const [value, setValue] = useControllable<DateRange | null>(valueProp, defaultValue, onChange)
  const [open, setOpenState] = useState(false)
  const [focusCalendar, setFocusCalendar] = useState(false)
  // Bumped on every open: the Calendar remounts fresh (day view, focus) even if reopened mid exit-animation.
  const [openSeq, setOpenSeq] = useState(0)
  const anchorRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const wide = useMediaQuery('(min-width: 720px)')
  const months = monthsProp ?? (wide ? 2 : 1)
  const today = todayProp ?? todayISO()
  const panelId = useId()
  const list = presets === false ? [] : (presets ?? defaultDatePresets(m))
  const complete = value?.start && value.end ? { start: value.start, end: value.end } : null

  const setOpen = (o: boolean, focusCal = false) => {
    if (o === open) return
    setFocusCalendar(focusCal)
    if (o) setOpenSeq((n) => n + 1)
    setOpenState(o)
    onOpenChange?.(o)
  }
  const apply = (r: DateRange | null) => {
    setValue(r)
    setOpen(false)
    triggerRef.current?.focus()
  }
  const resolve = (p: DateRangePreset) => {
    const r = typeof p.range === 'function' ? p.range(today) : p.range
    return { start: clampISODate(r.start, min, max), end: clampISODate(r.end, min, max) }
  }
  const onPanelKey = useTabOut(() => {
    setOpen(false)
    triggerRef.current?.focus()
  })

  return (
    <>
      <div
        ref={anchorRef}
        className={cx('nui-datepicker', 'nui-datepicker--range', className)}
        data-invalid={f.invalid || undefined}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
      >
        <button
          ref={(node) => {
            triggerRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as { current: HTMLButtonElement | null }).current = node
          }}
          id={f.id}
          type="button"
          className="nui-datepicker__value"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={f['aria-describedby']}
          aria-invalid={f['aria-invalid']}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          data-placeholder={!complete || undefined}
          onClick={() => setOpen(!open, true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && !open) {
              e.preventDefault()
              setOpen(true, true)
            }
          }}
        >
          <span className="nui-datepicker__text">{complete ? formatISODateRange(complete, locale) : (placeholder ?? m.chooseDateRange)}</span>
          <CalendarIcon className="nui-datepicker__icon" />
        </button>
        {clearable && complete && !disabled && (
          <button
            type="button"
            className="nui-datepicker__clear"
            aria-label={m.clearDate}
            title={m.clearDate}
            onClick={() => {
              setValue(null)
              triggerRef.current?.focus()
            }}
          >
            <CloseIcon />
          </button>
        )}
        {name && <input type="hidden" name={name} value={complete ? `${complete.start}/${complete.end}` : ''} />}
      </div>
      <FloatingPanel
        open={open}
        anchor={anchorRef}
        placement={placement}
        returnFocus={false}
        onDismiss={(reason) => {
          setOpen(false)
          if (reason === 'escape') triggerRef.current?.focus()
        }}
        id={panelId}
        role="dialog"
        aria-label={m.chooseDateRange}
        className="nui-datepicker__panel nui-daterange"
        data-months={months}
        onKeyDown={onPanelKey}
      >
        {list.length > 0 && (
          <div className="nui-daterange__presets" role="group" aria-label={m.presets}>
            {list.map((p) => {
              const r = resolve(p)
              const active = complete?.start === r.start && complete.end === r.end
              return (
                <button key={p.label} type="button" className="nui-daterange__preset" aria-pressed={active} onClick={() => apply(r)}>
                  {p.label}
                </button>
              )
            })}
          </div>
        )}
        <Calendar
          key={openSeq}
          mode="range"
          value={value}
          onChange={(r) => apply(r)}
          months={months}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          weekStartsOn={weekStartsOn}
          today={todayProp}
          autoFocus={focusCalendar}
        />
      </FloatingPanel>
    </>
  )
}
