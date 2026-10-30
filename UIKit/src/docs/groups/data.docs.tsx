import { Grid, Meter, Stack, UptimeBar, type UptimeDay } from '../../nui3'
import type { ComponentDoc } from '../types'

const days = (n: number, seed: number, gaps = 0): UptimeDay[] =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(2026, 7, 2 + i)).toISOString().slice(0, 10)
    if (i < gaps) return { date: d, status: 'none' }
    const r = (i * seed + 7) % 41
    return { date: d, status: r === 0 ? 'outage' : r < 3 ? 'degraded' : 'operational' }
  })

export const docs: ComponentDoc[] = [
  {
    name: 'Meter',
    group: 'data',
    className: 'nui-meter',
    description: '8px measured bar (role="meter") for quotas, fundraising, utilisation and share. Optional marks for caps and targets.',
    Demo: () => (
      <Grid cols={2}>
        <Stack gap={6}>
          <Meter label="Raised" value={6420} max={10000} valueText="6,420 / 10,000 ZEC" marks={[{ value: 5000, label: 'Soft cap' }, { value: 10000, label: 'Hard cap' }]} />
          <Meter label="Pool utilisation" value={82} tone="warning" marks={[{ value: 80, label: 'Kink 80%' }]} />
        </Stack>
        <Stack gap={6}>
          <Meter label="RPC quota" value={12} tone="positive" valueText="1.2M / 10M req" />
          <Meter label="Storage" value={97} tone="negative" />
          <Meter label="Empty" value={0} />
        </Stack>
      </Grid>
    ),
    usage: `<Meter label="Raised" value={6420} max={10000} valueText="6,420 / 10,000 ZEC" marks={[{ value: 5000, label: 'Soft cap' }]} />`,
    props: [
      ['value', 'number'],
      ['max', 'number = 100'],
      ['label', 'ReactNode'],
      ['tone', "'accent' | 'positive' | 'warning' | 'negative' = 'accent'"],
      ['marks', '{ value, label? }[]'],
      ['valueText', 'ReactNode — default rounded %'],
      ['ariaValueText', 'string'],
    ],
  },
  {
    name: 'UptimeBar',
    group: 'data',
    className: 'nui-uptime',
    description: 'One cell per day: operational (positive), degraded (warning), outage (negative), none (border). The bar is role="img" with "{label}: 99.98%".',
    Demo: () => (
      <Stack gap={6}>
        <UptimeBar label="Lightwalletd · eu-1" days={days(90, 13)} aside={<span className="nui-text-muted">90 days</span>} />
        <UptimeBar label="Noir relayer" days={days(90, 29)} uptime={99.98} />
        <UptimeBar label="New RPC region" days={days(60, 5, 34)} />
        <p className="nui-text-small nui-text-muted">Sample data. Hover a day for its date and status.</p>
      </Stack>
    ),
    usage: `<UptimeBar label="Lightwalletd · eu-1" days={[{ date: '2026-10-01', status: 'operational' }, …]} uptime={99.98} />`,
    props: [
      ['label', 'string'],
      ['days', "{ status: 'operational' | 'degraded' | 'outage' | 'none', date? }[]"],
      ['uptime', 'number 0–100 — default computed (degraded counts half)'],
      ['aside', 'ReactNode — head, before the percentage'],
    ],
  },
]
