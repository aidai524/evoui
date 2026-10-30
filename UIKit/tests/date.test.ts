// Pure calendar-date helpers. Run under several zones too:
//   TZ=America/Los_Angeles npx vitest run tests/date.test.ts
//   TZ=Asia/Shanghai npx vitest run tests/date.test.ts
import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  addYears,
  clampISODate,
  dayOfWeek,
  defaultDatePresets,
  daysInMonth,
  diffDays,
  endOfMonth,
  endOfWeek,
  formatISODate,
  formatISODateRange,
  formatMonthYear,
  fromLocalDate,
  isInRange,
  isValidISODate,
  isWithin,
  monthMatrix,
  monthNames,
  orderRange,
  parseDateInput,
  parseISODate,
  parseTimeInput,
  splitDateTime,
  startOfWeek,
  toISODate,
  todayISO,
  weekStartForLocale,
  weekdayNames,
} from '../src/nui3/utils/date'

describe('ISO parse / build', () => {
  it('parses strict YYYY-MM-DD and rejects impossible dates', () => {
    expect(parseISODate('2026-10-30')).toEqual({ year: 2026, month: 10, day: 30 })
    expect(parseISODate('2026-02-29')).toBeNull()
    expect(parseISODate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 })
    expect(parseISODate('2026-13-01')).toBeNull()
    expect(parseISODate('2026-1-01')).toBeNull()
    expect(parseISODate('2026-10-30T00:00')).toBeNull()
    expect(parseISODate(null)).toBeNull()
    expect(isValidISODate('1900-02-29')).toBe(false)
    expect(isValidISODate('2000-02-29')).toBe(true)
  })
  it('builds zero-padded dates', () => {
    expect(toISODate(2026, 1, 5)).toBe('2026-01-05')
    expect(toISODate(987, 3, 9)).toBe('0987-03-09')
    expect(toISODate(2026, 4, 31)).toBeNull()
  })
  it('knows month lengths', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2028, 2)).toBe(29)
    expect(daysInMonth(2026, 12)).toBe(31)
    expect(endOfMonth('2026-11-03')).toBe('2026-11-30')
  })
})

describe('arithmetic is calendar-exact (no DST drift)', () => {
  it('adds days across DST changes in either hemisphere', () => {
    // US DST starts 2026-03-08, ends 2026-11-01; EU 2026-03-29 / 2026-10-25.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02')
    expect(addDays('2026-03-29', -1)).toBe('2026-03-28')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
  })
  it('steps through every day of a year one by one', () => {
    let d = '2026-01-01'
    for (let i = 0; i < 365; i++) d = addDays(d, 1)
    expect(d).toBe('2027-01-01')
    expect(diffDays('2026-01-01', '2027-01-01')).toBe(365)
  })
  it('adds months with day clamping', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
    expect(addMonths('2026-10-30', -22)).toBe('2024-12-30')
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28')
  })
  it('knows weekdays', () => {
    expect(dayOfWeek('2026-10-30')).toBe(5) // Friday
    expect(dayOfWeek('1970-01-01')).toBe(4)
    expect(dayOfWeek('1969-12-28')).toBe(0)
    expect(dayOfWeek('2026-03-08')).toBe(0)
  })
})

describe('weeks and month matrix', () => {
  it('finds week bounds for either week start', () => {
    expect(startOfWeek('2026-10-30', 0)).toBe('2026-10-25')
    expect(startOfWeek('2026-10-30', 1)).toBe('2026-10-26')
    expect(endOfWeek('2026-10-30', 1)).toBe('2026-11-01')
    expect(startOfWeek('2026-10-25', 1)).toBe('2026-10-19')
    expect(startOfWeek('2026-10-26', 1)).toBe('2026-10-26')
  })
  it('builds a stable 6×7 grid starting on the week start', () => {
    const sun = monthMatrix('2026-10-15', 0)
    expect(sun).toHaveLength(6)
    expect(sun.every((w) => w.length === 7)).toBe(true)
    expect(sun[0][0]).toBe('2026-09-27')
    expect(sun[0][4]).toBe('2026-10-01')
    expect(sun[5][6]).toBe('2026-11-07')
    const mon = monthMatrix('2026-10-01', 1)
    expect(mon[0][0]).toBe('2026-09-28')
    expect(mon[0][3]).toBe('2026-10-01')
    expect(mon.flat().every((d, i, a) => i === 0 || diffDays(a[i - 1], d) === 1)).toBe(true)
    // A month starting on the week start begins in row 0, column 0.
    expect(monthMatrix('2026-02-10', 0)[0][0]).toBe('2026-02-01')
    // Across the US DST change (March) the grid stays contiguous.
    expect(monthMatrix('2026-03-01', 0).flat().filter((d) => d.startsWith('2026-03'))).toHaveLength(31)
  })
  it('picks the week start from the locale', () => {
    expect(weekStartForLocale('en-US')).toBe(0)
    expect(weekStartForLocale('zh-CN')).toBe(1)
    expect(weekStartForLocale('en-GB')).toBe(1)
  })
})

describe('clamping and ranges', () => {
  it('clamps into optional bounds', () => {
    expect(clampISODate('2026-10-30', '2026-11-01')).toBe('2026-11-01')
    expect(clampISODate('2026-10-30', null, '2026-10-01')).toBe('2026-10-01')
    expect(clampISODate('2026-10-30', '2026-10-01', '2026-12-01')).toBe('2026-10-30')
    expect(isWithin('2026-10-30', '2026-10-30', '2026-10-30')).toBe(true)
    expect(isWithin('2026-10-31', undefined, '2026-10-30')).toBe(false)
  })
  it('orders ranges and tests membership inclusively', () => {
    expect(orderRange('2026-11-02', '2026-10-30')).toEqual({ start: '2026-10-30', end: '2026-11-02' })
    expect(orderRange('2026-10-30', '2026-10-30')).toEqual({ start: '2026-10-30', end: '2026-10-30' })
    expect(isInRange('2026-10-30', '2026-10-30', '2026-11-02')).toBe(true)
    expect(isInRange('2026-11-02', '2026-10-30', '2026-11-02')).toBe(true)
    expect(isInRange('2026-11-03', '2026-10-30', '2026-11-02')).toBe(false)
    expect(isInRange('2026-10-30', '2026-10-30', null)).toBe(false)
  })
})

describe('range presets', () => {
  it('resolves the default presets against today', () => {
    const p = defaultDatePresets({ today: 'Today', last7Days: '7', last30Days: '30', thisMonth: 'Month' })
    const at = (i: number) => {
      const r = p[i].range
      return typeof r === 'function' ? r('2026-10-30') : r
    }
    expect(at(0)).toEqual({ start: '2026-10-30', end: '2026-10-30' })
    expect(at(1)).toEqual({ start: '2026-10-24', end: '2026-10-30' })
    expect(diffDays(at(2).start, at(2).end)).toBe(29)
    expect(at(3)).toEqual({ start: '2026-10-01', end: '2026-10-31' })
  })
})

describe('time-zone safety', () => {
  it('reads the local calendar day of a Date', () => {
    expect(fromLocalDate(new Date(2026, 9, 30, 0, 0))).toBe('2026-10-30')
    expect(fromLocalDate(new Date(2026, 9, 30, 23, 59))).toBe('2026-10-30')
    expect(todayISO(new Date(2026, 2, 8, 2, 30))).toBe('2026-03-08')
  })
  it('formats the same day whatever the host zone', () => {
    expect(formatISODate('2026-10-30', 'en-US')).toBe('Oct 30, 2026')
    expect(formatISODate('2026-10-30', 'zh-CN')).toBe('2026年10月30日')
    expect(formatISODate('2026-01-01', 'en-US', { dateStyle: 'full' })).toBe('Thursday, January 1, 2026')
    expect(formatMonthYear('2026-10-01', 'en-US')).toBe('October 2026')
    expect(formatMonthYear('2026-10-01', 'zh-CN')).toBe('2026年10月')
    expect(formatISODateRange({ start: '2026-10-01', end: '2026-10-30' }, 'en-US').replace(/\s/g, ' ')).toBe('Oct 1 – 30, 2026')
    expect(formatISODateRange({ start: '2026-10-30', end: '2026-10-30' }, 'en-US')).toBe('Oct 30, 2026')
    expect(formatISODateRange({ start: '2026-12-28', end: '2027-01-03' }, 'zh-CN')).toContain('2027')
  })
  it('names months and weekdays', () => {
    expect(monthNames('en-US', 'short')[0]).toBe('Jan')
    expect(monthNames('zh-CN')[9]).toBe('十月')
    expect(weekdayNames('en-US', 0, 'short')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    expect(weekdayNames('en-US', 1, 'narrow')[0]).toBe('M')
    expect(weekdayNames('zh-CN', 1, 'narrow')).toEqual(['一', '二', '三', '四', '五', '六', '日'])
  })
})

describe('typed entry', () => {
  it('accepts ISO and common numeric forms', () => {
    expect(parseDateInput('2026-10-30')).toBe('2026-10-30')
    expect(parseDateInput(' 2026/1/5 ')).toBe('2026-01-05')
    expect(parseDateInput('2026.10.30')).toBe('2026-10-30')
    expect(parseDateInput('20261030')).toBe('2026-10-30')
    expect(parseDateInput('2026年10月30日', 'zh-CN')).toBe('2026-10-30')
  })
  it('accepts the localized display format back', () => {
    expect(parseDateInput('Oct 30, 2026')).toBe('2026-10-30')
    expect(parseDateInput('october 30 2026')).toBe('2026-10-30')
    expect(parseDateInput('30 Oct 2026')).toBe('2026-10-30')
    expect(parseDateInput(formatISODate('2026-03-08', 'zh-CN'), 'zh-CN')).toBe('2026-03-08')
  })
  it('rejects nonsense and impossible dates', () => {
    expect(parseDateInput('')).toBeNull()
    expect(parseDateInput('2026-02-30')).toBeNull()
    expect(parseDateInput('Foo 30, 2026')).toBeNull()
    expect(parseDateInput('10/30/2026')).toBeNull()
    expect(parseDateInput('tomorrow')).toBeNull()
  })
  it('parses times and date-times', () => {
    expect(parseTimeInput('9:05')).toBe('09:05')
    expect(parseTimeInput('1430')).toBe('14:30')
    expect(parseTimeInput('24:00')).toBeNull()
    expect(splitDateTime('2026-10-30T14:30')).toEqual({ date: '2026-10-30', time: '14:30' })
    expect(splitDateTime('2026-10-30')).toEqual({ date: '2026-10-30', time: null })
    expect(splitDateTime(null)).toEqual({ date: null, time: null })
  })
})
