import { useState } from 'react'
import {
  Calendar,
  Cluster,
  DatePicker,
  DateRangePicker,
  Eyebrow,
  Field,
  Grid,
  Stack,
  addDays,
  dayOfWeek,
  formatISODate,
  startOfMonth,
  todayISO,
  useNuiLocale,
  type DateRange,
  type DateRangePreset,
} from '../../nui3'
import type { ComponentDoc } from '../types'

const isWeekend = (d: string) => dayOfWeek(d) === 0 || dayOfWeek(d) === 6

function Readout({ children }: { children: React.ReactNode }) {
  return <p className="nui-text-small nui-text-muted nui-mono">{children}</p>
}

function CalendarDemo() {
  const today = todayISO()
  const [day, setDay] = useState<string | null>(today)
  const [range, setRange] = useState<DateRange | null>({ start: addDays(today, -3), end: addDays(today, 4) })
  return (
    <Cluster gap={10} style={{ alignItems: 'flex-start' }}>
      <Stack gap={3}>
        <Eyebrow>Single · next 45 days</Eyebrow>
        <Calendar value={day} onChange={setDay} min={today} max={addDays(today, 45)} aria-label="Delivery date" />
        <Readout>value = {day ?? 'null'}</Readout>
      </Stack>
      <Stack gap={3}>
        <Eyebrow>Range · weekends disabled</Eyebrow>
        <Calendar mode="range" value={range} onChange={setRange} isDateDisabled={isWeekend} aria-label="Report period" />
        <Readout>
          {range?.start ?? '…'} → {range?.end ?? '…'}
        </Readout>
      </Stack>
    </Cluster>
  )
}

function DatePickerDemo() {
  const { t, locale } = useNuiLocale()
  const today = todayISO()
  const [a, setA] = useState<string | null>(null)
  const [b, setB] = useState<string | null>(addDays(today, 2))
  const [c, setC] = useState<string | null>('2026-10-31')
  const [d, setD] = useState<string | null>(`${today}T09:30`)
  const settleError = c && isWeekend(c) ? t('Settlement runs on business days only', '结算只在工作日进行') : !c ? t('Required', '必填') : undefined
  return (
    <Stack gap={6}>
      <Grid cols={2}>
        <Field label={t('Start date', '开始日期')} hint={t('Type 2026-10-30 or pick from the calendar.', '可输入 2026-10-30 或从日历中选择。')}>
          <DatePicker value={a} onChange={setA} name="start" />
        </Field>
        <Field label={t('Unlock date', '解锁日期')} hint={t('Between today and 90 days out.', '今天起 90 天内。')}>
          <DatePicker value={b} onChange={setB} min={today} max={addDays(today, 90)} />
        </Field>
        <Field label={t('Settlement date', '结算日期')} error={settleError}>
          <DatePicker value={c} onChange={setC} />
        </Field>
        <Field label={t('Business day', '工作日')} hint={t('Weekends are disabled.', '周末不可选。')}>
          <DatePicker isDateDisabled={isWeekend} defaultValue={null} />
        </Field>
        <Field label={t('Scheduled run', '计划执行')} hint={t('withTime: value is YYYY-MM-DDTHH:mm.', 'withTime：值为 YYYY-MM-DDTHH:mm。')}>
          <DatePicker withTime value={d} onChange={setD} />
        </Field>
        <Field label={t('Disabled', '禁用')} disabled>
          <DatePicker defaultValue={today} />
        </Field>
      </Grid>
      <Readout>
        start = {a ?? 'null'} · unlock = {b ?? 'null'} · settlement = {c ?? 'null'} · run = {d ?? 'null'}
        {b ? ` · ${formatISODate(b, locale, { dateStyle: 'full' })}` : ''}
      </Readout>
    </Stack>
  )
}

function DateRangePickerDemo() {
  const { t } = useNuiLocale()
  const today = todayISO()
  const [r, setR] = useState<DateRange | null>({ start: startOfMonth(today), end: today })
  const [q, setQ] = useState<DateRange | null>(null)
  const custom: DateRangePreset[] = [
    { label: t('Last 7 days', '最近 7 天'), range: (d) => ({ start: addDays(d, -6), end: d }) },
    { label: t('Last 90 days', '最近 90 天'), range: (d) => ({ start: addDays(d, -89), end: d }) },
    { label: t('Year to date', '今年至今'), range: (d) => ({ start: `${d.slice(0, 4)}-01-01`, end: d }) },
    { label: t('Last year', '去年'), range: (d) => ({ start: `${+d.slice(0, 4) - 1}-01-01`, end: `${+d.slice(0, 4) - 1}-12-31` }) },
  ]
  return (
    <Stack gap={6}>
      <Grid cols={2}>
        <Field label={t('Statement period', '账单周期')} hint={t('Default presets; two months on wide screens.', '默认快捷选项；宽屏显示两个月。')}>
          <DateRangePicker value={r} onChange={setR} name="period" />
        </Field>
        <Field label={t('Export history', '导出记录')} hint={t('Custom presets, no future dates.', '自定义快捷选项，不能选择未来日期。')} error={q ? undefined : t('Choose a range to export', '请选择导出范围')}>
          <DateRangePicker value={q} onChange={setQ} presets={custom} max={today} />
        </Field>
        <Field label={t('One month, no presets', '单月，无快捷选项')}>
          <DateRangePicker months={1} presets={false} isDateDisabled={isWeekend} />
        </Field>
        <Field label={t('Disabled', '禁用')} disabled>
          <DateRangePicker defaultValue={{ start: addDays(today, -6), end: today }} />
        </Field>
      </Grid>
      <Readout>
        period = {r ? `${r.start}/${r.end}` : 'null'} · export = {q ? `${q.start}/${q.end}` : 'null'}
      </Readout>
    </Stack>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'Calendar',
    group: 'forms',
    className: 'nui-calendar',
    description:
      'Inline month grid for one date or a range. Values are ISO `YYYY-MM-DD` strings (no time-zone drift). Title → month → year quick switch; keyboard per the WAI-ARIA date grid (arrows, Home/End, PageUp/PageDown, Shift+Page for years, Enter/Space); week start and names follow the locale.',
    Demo: CalendarDemo,
    usage: `import { Calendar } from '@nui3/react'

<Calendar value={date} onChange={setDate} min="2026-10-01" max="2026-12-31" />

<Calendar
  mode="range"
  months={2}
  value={range}            // { start, end }
  onChange={setRange}      // fires on the second click, ordered
  isDateDisabled={(d) => dayOfWeek(d) === 0 || dayOfWeek(d) === 6}
/>`,
    props: [
      ['mode', "'single' (default) | 'range'"],
      ['value / defaultValue', "single: ISO string | null · range: { start, end } | null"],
      ['onChange', 'single: (date) => void · range: ({ start, end }) => void — after the second click'],
      ['onRangeStart', '(start) => void — first click of a range'],
      ['min / max', 'ISO date bounds (inclusive)'],
      ['isDateDisabled', '(date: ISODate) => boolean — disabled days stay focusable'],
      ['weekStartsOn', '0–6; default from locale (en-US 0 Sunday, zh-CN 1 Monday)'],
      ['months', '1 | 2 — months side by side'],
      ['defaultMonth / onMonthChange', 'initial visible month · called with its first day'],
      ['today', 'ISO override for demos/tests'],
      ['autoFocus', 'focus the roving day on mount'],
    ],
  },
  {
    name: 'DatePicker',
    group: 'forms',
    className: 'nui-datepicker',
    description:
      'Input-like trigger with typed entry and a Calendar popover. Typing is validated on blur / Enter (ISO, 2026/10/30, 2026年10月30日 or the localized display); invalid text stays editable with aria-invalid. Display is localized while the value stays ISO; joins a Field like Input.',
    Demo: DatePickerDemo,
    usage: `import { DatePicker, Field } from '@nui3/react'

<Field label="Unlock date" error={err}>
  <DatePicker value={date} onChange={setDate} min={todayISO()} name="unlock" />
</Field>

<DatePicker withTime value="2026-10-30T09:30" onChange={…} />`,
    props: [
      ['value / defaultValue', 'ISO date string | null (YYYY-MM-DDTHH:mm with withTime)'],
      ['onChange', '(value: string | null) => void'],
      ['min / max / isDateDisabled / weekStartsOn', 'as Calendar; typed dates outside them are invalid'],
      ['placeholder', 'default "YYYY-MM-DD" / "年-月-日"'],
      ['clearable', 'boolean, default true — × button and footer Clear'],
      ['withTime', 'adds an HH:mm row; value becomes local wall-clock YYYY-MM-DDTHH:mm'],
      ['name', 'renders <input type="hidden"> with the ISO value'],
      ['disabled / invalid / required / id', 'as Input; Field supplies id, describedby and invalid'],
      ['placement / onOpenChange', 'popover placement (bottom-start) · open callback'],
      ['ref', 'Ref<HTMLInputElement> — the text input'],
    ],
  },
  {
    name: 'DateRangePicker',
    group: 'forms',
    className: 'nui-datepicker--range',
    description:
      'Range trigger with a presets column and a two-month Calendar (one month under 720px). First click sets the start, hover previews, the second click applies and closes; presets apply immediately.',
    Demo: DateRangePickerDemo,
    usage: `import { DateRangePicker, type DateRangePreset } from '@nui3/react'

<DateRangePicker value={range} onChange={setRange} max={todayISO()} />

const presets: DateRangePreset[] = [
  { label: 'Last 90 days', range: (today) => ({ start: addDays(today, -89), end: today }) },
]
<DateRangePicker presets={presets} name="period" />  // hidden value "start/end"`,
    props: [
      ['value / defaultValue', '{ start: ISODate | null; end: ISODate | null } | null'],
      ['onChange', '(range | null) => void — on the second click, a preset, or clear'],
      ['presets', 'DateRangePreset[] | false — default Today / Last 7 days / Last 30 days / This month'],
      ['months', '1 | 2 — default 2 at ≥ 720px, else 1'],
      ['min / max / isDateDisabled / weekStartsOn', 'as Calendar (presets are clamped to min/max)'],
      ['name', 'hidden input with the ISO 8601 interval "start/end"'],
      ['placeholder / clearable / disabled / invalid / id', 'as DatePicker'],
      ['ref', 'Ref<HTMLButtonElement> — the trigger'],
    ],
  },
]
