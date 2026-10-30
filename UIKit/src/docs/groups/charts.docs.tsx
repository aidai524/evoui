import { BarChart, BondingCurve, BondingCurveChart, CandleChart, Cluster, DepthChart, DonutChart, Eyebrow, Legend, LineChart, PriceChart, Sparkline, Stack } from '../../nui3'
import { BOOK, CANDLES, DAYS, PRICE_SERIES, walk } from '../sample'
import type { ComponentDoc } from '../types'

const usd = (v: number) => `$${v.toFixed(2)}`
const PRICE_POINTS = PRICE_SERIES.map((value, i) => ({ t: Date.UTC(2026, 8, 30 + i), value }))
const PROB_POINTS = walk(30, 0.42, 0.04, 3).map((v, i) => ({ t: Date.UTC(2026, 8, 30 + i), value: Math.min(0.98, v) }))
const NET_FLOW = PRICE_SERIES.slice(1, 15).map((v, i) => Math.round((v - PRICE_SERIES[i]) * 40))
const curve = (s: number) => 0.00002 + (s / 1e9) ** 2 * 0.0004

const Caption = ({ children }: { children: string }) => <Eyebrow>{children}</Eyebrow>

export const docs: ComponentDoc[] = [
  {
    name: 'LineChart',
    group: 'charts',
    className: 'nui-chart',
    description:
      'Line / area chart. Series take chart-1..5 in order; area uses a same-colour vertical fade. Focus and press ←/→ to read values; the svg carries a range summary.',
    Demo: () => (
      <Stack gap={8}>
        <LineChart
          label="ZEC vs nZEC, 30 days"
          series={[
            { name: 'ZEC', data: PRICE_SERIES, area: true },
            { name: 'nZEC', data: PRICE_SERIES.map((v, i) => v * (0.985 + (i % 5) * 0.003)) },
            { name: 'Target', data: PRICE_SERIES.map((_, i) => 46 + i * 0.05), dashed: true },
          ]}
          labels={DAYS}
          yFormat={usd}
          referenceY={[{ value: 47, label: 'Entry' }]}
          referenceX={[{ index: 20, label: 'Upgrade' }]}
          markers={[{ index: 12, label: 'Buy' }]}
        />
        <Stack gap={2}>
          <Caption>Step curve</Caption>
          <LineChart curve="step" height={160} series={[{ name: 'Fee (bps)', data: [30, 30, 25, 25, 25, 20, 20, 15, 15, 15, 10, 10] }]} yMin={0} />
        </Stack>
        <Stack gap={2}>
          <Caption>No data</Caption>
          <LineChart height={160} series={[]} />
        </Stack>
      </Stack>
    ),
    usage: `import { LineChart } from '@nui3/react'

<LineChart
  label="ZEC price, 30 days"
  series={[{ name: 'ZEC', data: prices, area: true }]}
  labels={days}
  yFormat={(v) => \`$\${v.toFixed(2)}\`}
  referenceY={[{ value: 47, label: 'Entry' }]}
/>`,
    props: [
      ['series', '{ name: string; data: number[]; color?: string; area?: boolean; dashed?: boolean }[]'],
      ['labels', 'string[] — one per index'],
      ['height', 'number = 240'],
      ['yTicks / xTicks', 'number = 4 / 5'],
      ['yFormat', '(v: number) => string'],
      ['referenceY', '{ value: number; label?: string }[]'],
      ['referenceX', '{ index: number; label?: string }[]'],
      ['markers', '{ index: number; series?: number; label?: string }[]'],
      ['curve', "'linear' | 'step' = 'linear'"],
      ['legend', 'boolean (default: 2+ series)'],
      ['yMin / yMax', 'number'],
      ['label', 'string — accessible name prefix'],
    ],
  },
  {
    name: 'PriceChart',
    group: 'charts',
    className: 'nui-chart',
    description: '`{t, value}` adapter over LineChart: area by default, injected price format; `probability` fixes the axis to 0–1 and formats as percent.',
    Demo: () => (
      <Stack gap={8}>
        <PriceChart label="ZEC / USD" data={PRICE_POINTS} format={usd} />
        <Stack gap={2}>
          <Caption>Probability</Caption>
          <PriceChart label="Outcome YES" name="YES" data={PROB_POINTS} probability height={180} referenceY={[{ value: 0.5, label: '50%' }]} />
        </Stack>
      </Stack>
    ),
    usage: `import { PriceChart } from '@nui3/react'

<PriceChart data={[{ t: 1727654400000, value: 46.2 }, …]} format={(v) => \`$\${v.toFixed(2)}\`} />
<PriceChart data={yesSeries} probability />`,
    props: [
      ['data', '{ t: number | string | Date; value: number }[]'],
      ['name', 'string = m.price'],
      ['format', '(v: number) => string'],
      ['timeFormat', '(t) => string'],
      ['area', 'boolean = true'],
      ['probability', 'boolean — yMin 0, yMax 1, percent'],
      ['…', 'all LineChart props except series / labels / yFormat'],
    ],
  },
  {
    name: 'CandleChart',
    group: 'charts',
    className: 'nui-chart',
    description: 'OHLC candles (up positive, down negative, 1px wicks) with a 16% volume pane, OHLCV readout row, crosshair and an accent last-price label.',
    Demo: () => <CandleChart label="ZEC / USDC, 1h" data={CANDLES} />,
    usage: `import { CandleChart } from '@nui3/react'

<CandleChart data={candles /* { t, o, h, l, c, v }[] */} />`,
    props: [
      ['data', '{ t: number | string | Date; o; h; l; c: number; v?: number }[]'],
      ['height', 'number = 320'],
      ['volume', 'boolean (default: when any v)'],
      ['format / volumeFormat', '(v: number) => string'],
      ['timeFormat', '(t) => string'],
      ['yTicks / xTicks', 'number = 4 / 5'],
      ['label', 'string'],
    ],
  },
  {
    name: 'BarChart',
    group: 'charts',
    className: 'nui-chart',
    description: 'Bars with adaptive width. `signed` colours positive and negative bars separately around a zero baseline.',
    Demo: () => (
      <Stack gap={8}>
        <BarChart label="Daily volume" name="Volume" data={CANDLES.slice(0, 24).map((c) => Math.round(c.v))} labels={CANDLES.slice(0, 24).map((_, i) => `${String(i).padStart(2, '0')}h`)} />
        <Stack gap={2}>
          <Caption>Signed</Caption>
          <BarChart label="Net flow, ZEC" name="Net flow" signed data={NET_FLOW} labels={DAYS.slice(0, 14)} />
        </Stack>
      </Stack>
    ),
    usage: `import { BarChart } from '@nui3/react'

<BarChart signed data={[12, -4, 8, -9]} labels={['Mon', 'Tue', 'Wed', 'Thu']} />`,
    props: [
      ['data', 'number[]'],
      ['labels', 'string[]'],
      ['name', 'string'],
      ['height', 'number = 200'],
      ['signed', 'boolean'],
      ['color', 'string = var(--nui-chart-1)'],
      ['yFormat', '(v: number) => string'],
      ['yTicks / xTicks', 'number = 4 / 6'],
    ],
  },
  {
    name: 'DonutChart',
    group: 'charts',
    className: 'nui-chart nui-chart--donut',
    description: 'Share-of-total ring starting at −90°, with tabular centre content and a vertical legend. ←/→ steps through segments.',
    Demo: () => (
      <Stack gap={8}>
        <DonutChart
          label="Shielded supply by pool"
          data={[
            { label: 'Orchard', value: 3_120_000 },
            { label: 'Sapling', value: 1_480_000 },
            { label: 'Transparent', value: 820_000 },
            { label: 'Sprout', value: 24_000 },
          ]}
          center={
            <>
              <span className="nui-chart__center-value">5.44M</span>
              <span className="nui-chart__center-label">ZEC</span>
            </>
          }
        />
        <DonutChart data={[]} />
      </Stack>
    ),
    usage: `import { DonutChart } from '@nui3/react'

<DonutChart data={[{ label: 'Orchard', value: 3.1 }, { label: 'Sapling', value: 1.5 }]} center="4.6M" />`,
    props: [
      ['data', '{ label: string; value: number; color?: string }[]'],
      ['size', 'number = 168'],
      ['thickness', 'number = 18'],
      ['center', 'ReactNode'],
      ['legend', 'boolean = true'],
      ['format', '(v: number) => string'],
      ['label', 'string'],
    ],
  },
  {
    name: 'DepthChart',
    group: 'charts',
    className: 'nui-chart',
    description: 'Cumulative order-book depth: bids (positive) and asks (negative) as 1.5px step areas around a dashed mid line.',
    Demo: () => <DepthChart label="ZEC / USDC depth" bids={BOOK.bids} asks={BOOK.asks} format={usd} />,
    usage: `import { DepthChart } from '@nui3/react'

<DepthChart bids={[{ price: 47.1, size: 0.8 }]} asks={[{ price: 47.15, size: 0.6 }]} />`,
    props: [
      ['bids / asks', '{ price: number; size: number }[]'],
      ['height', 'number = 200'],
      ['format', '(price: number) => string'],
      ['sizeFormat', '(size: number) => string'],
      ['yTicks / xTicks', 'number = 4 / 5'],
      ['label', 'string'],
    ],
  },
  {
    name: 'BondingCurve',
    group: 'charts',
    className: 'nui-chart',
    description: 'price(supply) sampled 60 times: the full curve dashed, the sold part filled, and a marker at the current supply.',
    Demo: () => (
      <BondingCurve
        label="NOIR launch curve"
        price={curve}
        maxSupply={1e9}
        sold={4.2e8}
        nowLabel="Now"
        format={(v) => `$${v.toFixed(5)}`}
      />
    ),
    usage: `import { BondingCurve } from '@nui3/react'

<BondingCurve price={(s) => 0.00002 + (s / 1e9) ** 2 * 0.0004} maxSupply={1e9} sold={4.2e8} nowLabel="Now" />`,
    props: [
      ['price', '(supply: number) => number'],
      ['maxSupply', 'number'],
      ['sold', 'number'],
      ['nowLabel', 'string'],
      ['samples', 'number = 60'],
      ['height', 'number = 240'],
      ['format / supplyFormat', '(v: number) => string'],
      ['color', 'string = var(--nui-chart-1)'],
    ],
  },
  {
    name: 'BondingCurveChart',
    group: 'charts',
    className: 'nui-chart',
    description: 'LaunchPad-named alias of BondingCurve; identical props and behaviour.',
    Demo: () => <BondingCurveChart price={(s) => 0.001 + s * 1e-9} maxSupply={8e8} sold={7.6e8} nowLabel="Graduating" height={200} format={(v) => `$${v.toFixed(4)}`} />,
    usage: `import { BondingCurveChart } from '@nui3/react'

<BondingCurveChart price={price} maxSupply={8e8} sold={sold} nowLabel="Now" />`,
    props: [['…', 'same as BondingCurve (price, maxSupply, sold, nowLabel, samples, height, format, supplyFormat, color, label)']],
  },
  {
    name: 'Sparkline',
    group: 'charts',
    className: 'nui-sparkline',
    description: '96×28 trend line with no axes. Auto tone follows first → last direction; decorative (aria-hidden) unless given a label.',
    Demo: () => (
      <Cluster gap={6}>
        <Sparkline data={PRICE_SERIES} label="ZEC 30 days, up" />
        <Sparkline data={[...PRICE_SERIES].reverse()} />
        <Sparkline data={walk(30, 10, 0.03, 5)} tone="neutral" />
        <Sparkline data={walk(40, 10, 0.03, 9)} width={160} height={40} />
      </Cluster>
    ),
    usage: `import { Sparkline } from '@nui3/react'

<Sparkline data={prices} label="ZEC 7 days" />`,
    props: [
      ['data', 'number[]'],
      ['width / height', 'number = 96 / 28'],
      ['tone', "'auto' | 'neutral' | 'positive' | 'negative' = 'auto'"],
      ['label', 'string — without it the svg is aria-hidden'],
    ],
  },
  {
    name: 'Legend',
    group: 'charts',
    className: 'nui-chart__legend',
    description: 'Standalone chart legend: 8×8 swatch, label, optional tabular value. Colours default to chart-1..5 by position.',
    Demo: () => (
      <Stack gap={4}>
        <Legend items={[{ label: 'ZEC' }, { label: 'nZEC' }, { label: 'USDC' }, { label: 'NEAR' }, { label: 'ETH' }]} />
        <Legend
          direction="column"
          style={{ maxWidth: 240 }}
          items={[
            { label: 'Bids', color: 'var(--nui-positive)', value: '18.4' },
            { label: 'Asks', color: 'var(--nui-negative)', value: '16.1' },
            { label: 'Forecast', value: '—', dashed: true },
          ]}
        />
      </Stack>
    ),
    usage: `import { Legend } from '@nui3/react'

<Legend items={[{ label: 'ZEC', value: '$47.12' }, { label: 'nZEC', color: 'var(--nui-chart-2)' }]} />`,
    props: [
      ['items', '{ label: ReactNode; color?: string; value?: ReactNode; dashed?: boolean }[]'],
      ['direction', "'row' | 'column' = 'row'"],
    ],
  },
]
