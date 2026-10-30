// Calendar-date helpers for Calendar / DatePicker / DateRangePicker.
// Dates are plain calendar days written as ISO `YYYY-MM-DD` strings. All arithmetic goes through
// Date.UTC day numbers and every Intl call formats with timeZone 'UTC', so the result never depends
// on the host time zone or DST transitions. Only `todayISO` / `fromLocalDate` read the local clock.

/** ISO calendar date `YYYY-MM-DD`. */
export type ISODate = string

/** Inclusive date range; `null` ends are open (range being chosen). */
export interface DateRange {
  start: ISODate | null
  end: ISODate | null
}

/** 0 = Sunday … 6 = Saturday. */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6

const DAY_MS = 86_400_000
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

/** Days in `month` (1–12) of `year`. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Build an ISO date from parts (month 1–12). Returns null for impossible dates (Feb 30, month 13…). */
export function toISODate(year: number, month: number, day: number): ISODate | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`
}

/** Strict `YYYY-MM-DD` parse → { year, month (1–12), day }, or null. */
export function parseISODate(s: string | null | undefined): { year: number; month: number; day: number } | null {
  const m = typeof s === 'string' ? ISO_RE.exec(s) : null
  if (!m) return null
  const year = +m[1]
  const month = +m[2]
  const day = +m[3]
  return toISODate(year, month, day) ? { year, month, day } : null
}

export const isValidISODate = (s: string | null | undefined): s is ISODate => parseISODate(s) !== null

/** Day number since 1970-01-01 (UTC, so no DST holes). */
function dayNumber(iso: ISODate): number {
  const p = parseISODate(iso)
  if (!p) throw new RangeError(`Invalid ISO date: ${iso}`)
  const d = new Date(0)
  d.setUTCFullYear(p.year, p.month - 1, p.day)
  return Math.round(d.getTime() / DAY_MS)
}

function fromDayNumber(n: number): ISODate {
  const d = new Date(n * DAY_MS)
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** UTC-noon Date for Intl formatting (format it with timeZone 'UTC'). */
export function isoToUTCDate(iso: ISODate): Date {
  return new Date(dayNumber(iso) * DAY_MS + DAY_MS / 2)
}

/** The calendar day a local Date falls on (its local Y/M/D). */
export function fromLocalDate(date: Date): ISODate {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Today in the host time zone. */
export const todayISO = (now: Date = new Date()): ISODate => fromLocalDate(now)

export function addDays(iso: ISODate, n: number): ISODate {
  return fromDayNumber(dayNumber(iso) + n)
}

/** Add months, clamping the day to the target month's length (Jan 31 + 1 → Feb 28/29). */
export function addMonths(iso: ISODate, n: number): ISODate {
  const p = parseISODate(iso)
  if (!p) throw new RangeError(`Invalid ISO date: ${iso}`)
  const idx = p.year * 12 + (p.month - 1) + n
  const year = Math.floor(idx / 12)
  const month = (idx - year * 12) + 1
  return toISODate(year, month, Math.min(p.day, daysInMonth(year, month))) as ISODate
}

export const addYears = (iso: ISODate, n: number): ISODate => addMonths(iso, n * 12)

/** -1 / 0 / 1. ISO strings with 4-digit years sort lexically. */
export const compareISODate = (a: ISODate, b: ISODate): number => (a < b ? -1 : a > b ? 1 : 0)

export const isSameMonth = (a: ISODate, b: ISODate) => a.slice(0, 7) === b.slice(0, 7)

/** Whole days from a to b (b − a). */
export const diffDays = (a: ISODate, b: ISODate): number => dayNumber(b) - dayNumber(a)

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(iso: ISODate): WeekDay {
  // 1970-01-01 was a Thursday (4).
  return ((((dayNumber(iso) + 4) % 7) + 7) % 7) as WeekDay
}

export const startOfMonth = (iso: ISODate): ISODate => `${iso.slice(0, 7)}-01`

export function endOfMonth(iso: ISODate): ISODate {
  const p = parseISODate(iso)
  if (!p) throw new RangeError(`Invalid ISO date: ${iso}`)
  return toISODate(p.year, p.month, daysInMonth(p.year, p.month)) as ISODate
}

export function startOfWeek(iso: ISODate, weekStartsOn: WeekDay = 0): ISODate {
  return addDays(iso, -((dayOfWeek(iso) - weekStartsOn + 7) % 7))
}

export const endOfWeek = (iso: ISODate, weekStartsOn: WeekDay = 0): ISODate => addDays(startOfWeek(iso, weekStartsOn), 6)

/**
 * Six weeks × seven ISO dates covering the month of `iso` (any day in it), starting on `weekStartsOn`.
 * Always six rows so the grid height never jumps between months.
 */
export function monthMatrix(iso: ISODate, weekStartsOn: WeekDay = 0): ISODate[][] {
  const first = startOfWeek(startOfMonth(iso), weekStartsOn)
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)))
}

/** Clamp into [min, max] (either bound optional). */
export function clampISODate(iso: ISODate, min?: ISODate | null, max?: ISODate | null): ISODate {
  if (min && iso < min) return min
  if (max && iso > max) return max
  return iso
}

export const isWithin = (iso: ISODate, min?: ISODate | null, max?: ISODate | null) => (!min || iso >= min) && (!max || iso <= max)

/** Order two dates into a range (start ≤ end). */
export function orderRange(a: ISODate, b: ISODate): { start: ISODate; end: ISODate } {
  return a <= b ? { start: a, end: b } : { start: b, end: a }
}

/** Inclusive membership; false when either end is missing. */
export const isInRange = (iso: ISODate, start: ISODate | null | undefined, end: ISODate | null | undefined) =>
  !!start && !!end && iso >= start && iso <= end

/** First day of week for a locale: Intl weekInfo when the runtime has it, else zh/en-GB style Monday, en-US Sunday. */
export function weekStartForLocale(locale: string): WeekDay {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } }
    const info = loc.getWeekInfo?.() ?? loc.weekInfo
    if (info && Number.isInteger(info.firstDay)) return (info.firstDay % 7) as WeekDay
  } catch {
    /* fall through */
  }
  return /^(en-US|en$|ja|ko|he|pt-BR|zh-TW|zh-HK)/i.test(locale) ? 0 : 1
}

/* ───────────────────────── Intl names / formatting ───────────────────────── */

const fmtCache = new Map<string, Intl.DateTimeFormat>()
function fmt(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(opts)
  let f = fmtCache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' })
    fmtCache.set(key, f)
  }
  return f
}

/** Format an ISO date with Intl, time-zone safe. Default: medium date ("Oct 30, 2026" / "2026年10月30日"). */
export function formatISODate(iso: ISODate, locale: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  return fmt(locale, opts).format(isoToUTCDate(iso))
}

/** Range display via Intl formatRange: "Oct 1 – 30, 2026" / "2026年10月1日至30日". */
export function formatISODateRange(r: { start: ISODate; end: ISODate }, locale: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  const f = fmt(locale, opts)
  return r.start === r.end ? f.format(isoToUTCDate(r.start)) : f.formatRange(isoToUTCDate(r.start), isoToUTCDate(r.end))
}

/** "October 2026" / "2026年10月". */
export const formatMonthYear = (iso: ISODate, locale: string) => formatISODate(iso, locale, { year: 'numeric', month: 'long' })

/** Twelve month names, January first. */
export function monthNames(locale: string, width: 'long' | 'short' = 'long'): string[] {
  return Array.from({ length: 12 }, (_, i) => formatISODate(`2021-${pad(i + 1)}-15`, locale, { month: width }))
}

/** Seven weekday names starting at `weekStartsOn`. */
export function weekdayNames(locale: string, weekStartsOn: WeekDay = 0, width: 'long' | 'short' | 'narrow' = 'short'): string[] {
  // 2021-08-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => formatISODate(`2021-08-${pad(1 + ((weekStartsOn + i) % 7))}`, locale, { weekday: width }))
}

/**
 * Parse what a person types into a date field. Accepts `2026-10-30`, `2026/10/30`, `2026.10.30`, `20261030`,
 * `2026年10月30日`, and the locale's own medium/long display (`Oct 30, 2026`, `30 October 2026`).
 * Returns null when it is not a real calendar date.
 */
export function parseDateInput(text: string, locale = 'en-US'): ISODate | null {
  const s = text.trim()
  if (!s) return null
  let m = /^(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})\s*日?$/.exec(s) ?? /^(\d{4})(\d{2})(\d{2})$/.exec(s)
  if (m) return toISODate(+m[1], +m[2], +m[3])
  // Month name forms, matched against the locale's (and English) month names.
  const names = [locale, 'en-US'].flatMap((l) => [monthNames(l, 'long'), monthNames(l, 'short')])
  const monthOf = (word: string) => {
    const w = word.toLowerCase().replace(/\.$/, '')
    for (const list of names) {
      const i = list.findIndex((n) => n.toLowerCase().replace(/\.$/, '') === w)
      if (i >= 0) return i + 1
    }
    return 0
  }
  m = /^([^\d\s,]+)\s+(\d{1,2}),?\s+(\d{4})$/.exec(s) // Oct 30, 2026
  if (m) return monthOf(m[1]) ? toISODate(+m[3], monthOf(m[1]), +m[2]) : null
  m = /^(\d{1,2})\s+([^\d\s,]+),?\s+(\d{4})$/.exec(s) // 30 Oct 2026
  if (m) return monthOf(m[2]) ? toISODate(+m[3], monthOf(m[2]), +m[1]) : null
  return null
}

/* ───────────────────────── Range presets ───────────────────────── */

export interface DateRangePreset {
  label: string
  /** Fixed range or a function of today (ISO). */
  range: { start: ISODate; end: ISODate } | ((today: ISODate) => { start: ISODate; end: ISODate })
}

/** Default shortcuts, labelled from the message catalogue. */
export function defaultDatePresets(m: { today: string; last7Days: string; last30Days: string; thisMonth: string }): DateRangePreset[] {
  return [
    { label: m.today, range: (t) => ({ start: t, end: t }) },
    { label: m.last7Days, range: (t) => ({ start: addDays(t, -6), end: t }) },
    { label: m.last30Days, range: (t) => ({ start: addDays(t, -29), end: t }) },
    { label: m.thisMonth, range: (t) => ({ start: startOfMonth(t), end: endOfMonth(t) }) },
  ]
}

/* ───────────────────────── Time (DatePicker withTime) ───────────────────────── */

/** `YYYY-MM-DDTHH:mm` local wall-clock value. */
export type ISODateTime = string

/** Split `YYYY-MM-DDTHH:mm` (or a bare date) → { date, time }. */
export function splitDateTime(v: string | null | undefined): { date: ISODate | null; time: string | null } {
  if (!v) return { date: null, time: null }
  const [d, t] = v.split('T')
  return { date: isValidISODate(d) ? d : null, time: t && isValidTime(t) ? t : null }
}

export const isValidTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)

/** Parse `14:30`, `9:05`, `1430` → `HH:mm`. */
export function parseTimeInput(text: string): string | null {
  const m = /^(\d{1,2}):?(\d{2})$/.exec(text.trim())
  if (!m) return null
  const t = `${pad(+m[1])}:${m[2]}`
  return isValidTime(t) ? t : null
}
