import { useEffect, useState } from 'react'
import { Alert, Cluster, Countdown, LeverageSlider, LiveValue, OrderBook, PnL, PositionTable, Stack, type Position } from '../../nui3'
import { BOOK } from '../sample'
import type { ComponentDoc } from '../types'

function OrderBookDemo() {
  const [price, setPrice] = useState<string>('—')
  return (
    <Stack gap={4} style={{ maxWidth: 360 }}>
      <OrderBook
        bids={BOOK.bids}
        asks={BOOK.asks}
        rows={6}
        last={47.12}
        lastDirection="up"
        onSelectPrice={(p, side) => setPrice(`${side} @ ${p.toFixed(2)}`)}
      />
      <p className="nui-text-small nui-text-secondary">Clicked level: {price}</p>
    </Stack>
  )
}

function LeverageDemo() {
  const [lev, setLev] = useState(5)
  return (
    <Stack gap={5} style={{ maxWidth: 440 }}>
      <LeverageSlider value={lev} onChange={setLev} />
      {lev > 10 && (
        <Alert tone="warning" title="High leverage.">
          At {lev}× a {(100 / lev).toFixed(1)}% move against you liquidates the position. Funding is charged every 8 hours.
        </Alert>
      )}
    </Stack>
  )
}

const POSITIONS: Position[] = [
  { id: 'p1', market: 'ZEC-PERP', side: 'long', size: '12.5 ZEC', entry: 45.2, mark: 47.12, liq: 38.9, leverage: 5, pnl: 24.0, pnlPercent: 4.25 },
  { id: 'p2', market: 'NEAR-PERP', side: 'short', size: '300 NEAR', entry: 3.32, mark: 3.41, liq: 3.98, leverage: 10, pnl: -27.0, pnlPercent: -2.71 },
  { id: 'p3', market: 'BTC-PERP', side: 'long', size: '0.02 BTC', entry: 68210, mark: 68210, liq: 61400, leverage: 3, pnl: 0 },
]

function PositionDemo() {
  const [rows, setRows] = useState(POSITIONS)
  return (
    <PositionTable
      positions={rows}
      onClose={(p) => setRows((r) => r.filter((x) => x.id !== p.id))}
      empty={<p className="nui-text-small nui-text-muted">All positions closed. Reload the page to reset.</p>}
    />
  )
}

function LiveDemo() {
  const [v, setV] = useState(47.12)
  useEffect(() => {
    let s = 7
    const id = setInterval(() => {
      s = (s * 16807) % 2147483647
      setV((x) => Math.round((x + ((s / 2147483647) - 0.5) * 0.2) * 100) / 100)
    }, 1400)
    return () => clearInterval(id)
  }, [])
  const f = (n: number) => `$${n.toFixed(2)}`
  return (
    <Cluster gap={6}>
      <span className="nui-text-small">
        Mark <LiveValue value={v} format={f} />
      </span>
      <span className="nui-text-small">
        Colored <LiveValue value={v} format={f} colored />
      </span>
    </Cluster>
  )
}

function CountdownDemo() {
  const [t0] = useState(() => Date.now())
  return (
    <Stack gap={3} className="nui-text-small">
      <span>
        Funding in <Countdown to={t0 + 3 * 3600_000 + 12 * 60_000} />
      </span>
      <span>
        Market closes <Countdown to={t0 + 2 * 86400_000 + 5 * 3600_000} />
      </span>
      <span>
        Full: <Countdown to={t0 + 26 * 3600_000} compact={false} />
      </span>
      <span>
        Short: <Countdown to={t0 + 8_000} />
      </span>
      <span>
        Past: <Countdown to={t0 - 1000} />
      </span>
    </Stack>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'OrderBook',
    group: 'trading',
    className: 'nui-book',
    description:
      'Asks above, bids below, cumulative depth bars filled from the right, mid row with last price and spread. With onSelectPrice each row is a focusable button (Enter / Space) labelled like "Bids 47.10, Size 0.80".',
    Demo: OrderBookDemo,
    usage: `<OrderBook bids={bids} asks={asks} last={47.12} lastDirection="up" onSelectPrice={(p) => setPrice(p)} />`,
    props: [
      ['bids / asks', '{ price: number; size: number }[]'],
      ['rows', 'number = 8'],
      ['priceDecimals', 'number = 2'],
      ['sizeDecimals', 'number = 2'],
      ['last', 'number'],
      ['lastDirection', "'up' | 'down'"],
      ['onSelectPrice', "(price, side: 'bid' | 'ask') => void"],
    ],
  },
  {
    name: 'LeverageSlider',
    group: 'trading',
    className: 'nui-leverage',
    description: 'Slider with a boxed value readout. Above warnAbove the value and track turn warning; above dangerAbove (max / 2) negative. Pair high leverage with a warning Alert.',
    Demo: LeverageDemo,
    usage: `<LeverageSlider value={lev} onChange={setLev} max={50} warnAbove={10} />`,
    props: [
      ['value / onChange', 'number / (n) => void'],
      ['min / max / step', 'number = 1 / 50 / 1'],
      ['warnAbove', 'number = 10'],
      ['dangerAbove', 'number = max / 2'],
      ['marks', 'number[]'],
      ['label', 'ReactNode = m.leverage'],
    ],
  },
  {
    name: 'PnL',
    group: 'trading',
    className: 'nui-pnl',
    description: 'Signed profit and loss in fiat with an optional small percent; positive green, negative red.',
    Demo: () => (
      <Cluster gap={6}>
        <PnL value={1234.5} percent={4.25} />
        <PnL value={-27} percent={-2.71} />
        <PnL value={0} />
        <PnL value={0.004} currency="EUR" />
      </Cluster>
    ),
    usage: `<PnL value={1234.5} percent={4.25} />`,
    props: [
      ['value', 'number'],
      ['percent', 'number'],
      ['currency', "string = 'USD'"],
    ],
  },
  {
    name: 'PositionTable',
    group: 'trading',
    className: 'nui-table-wrap',
    description: 'DataTable of open positions: market, side Badge, size, entry, mark, liquidation price (warning), leverage, PnL and a small Close button.',
    Demo: PositionDemo,
    usage: `<PositionTable positions={positions} onClose={(p) => closePosition(p.id)} />`,
    props: [
      ['positions', '{ id, market, side, size, entry, mark, liq, leverage, pnl, pnlPercent? }[]'],
      ['onClose', '(position) => void'],
      ['priceDecimals', 'number = 2'],
      ['currency', "string = 'USD'"],
      ['…', 'DataTable props (loading, empty, defaultSort…)'],
    ],
  },
  {
    name: 'LiveValue',
    group: 'trading',
    className: 'nui-live',
    description: 'Flashes its background once (0.9s, up green / down red) when the value changes; colored keeps the direction colour. aria-live="off" — high-frequency values are not announced.',
    Demo: LiveDemo,
    usage: `<LiveValue value={mark} format={(n) => formatFiat(n)} />`,
    props: [
      ['value', 'number'],
      ['format', '(n: number) => string'],
      ['colored', 'boolean'],
    ],
  },
  {
    name: 'Countdown',
    group: 'trading',
    className: 'nui-countdown',
    description: 'Ticking <time dateTime> with bold numbers and muted units; compact (default) drops leading zero units and shows at most three. Shows "Ended" when the target passes.',
    Demo: CountdownDemo,
    usage: `<Countdown to={market.closesAt} onEnd={refresh} />`,
    props: [
      ['to', 'Date | number | string'],
      ['compact', 'boolean = true'],
      ['onEnd', '() => void'],
    ],
  },
]
