import { useState, type ReactNode } from 'react'
import {
  Button,
  Cluster,
  DetailList,
  formatFiat,
  HealthFactor,
  PrivacyBadge,
  Segmented,
  Stack,
  Switch,
  SwapSwitch,
  TokenAmountInput,
  TokenPicker,
} from '../../nui3'
import { TOKENS, type SampleToken } from '../sample'
import type { ComponentDoc } from '../types'

const usd = (value: string, t?: SampleToken) => {
  const n = Number(value || 0) * (t?.usd ?? 0)
  return n ? `≈ ${formatFiat(n)}` : undefined
}

function Labelled({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={2}>
      <p className="nui-text-small nui-text-muted">{title}</p>
      {children}
    </Stack>
  )
}

function TokenAmountInputDemo() {
  const [value, setValue] = useState('1.25')
  const [token, setToken] = useState<SampleToken | null>(TOKENS[0])
  const [recvValue, setRecvValue] = useState('')
  const [recv, setRecv] = useState<SampleToken | null>(null)
  const [overValue, setOverValue] = useState('3.5')
  const [loading, setLoading] = useState(true)
  const [ext, setExt] = useState<SampleToken>(TOKENS[2])
  const [extValue, setExtValue] = useState('')
  const [open, setOpen] = useState(false)
  return (
    <Stack gap={6} style={{ maxWidth: 440 }}>
      <Labelled title="price → fiat, built-in token dropdown, 25 / 50 / 75 / Max">
        <TokenAmountInput
          label="You pay"
          aside={<PrivacyBadge level="shielded" />}
          value={value}
          onChange={setValue}
          token={token}
          tokens={TOKENS}
          popularTokens={['ZEC', 'USDC', 'NEAR']}
          onTokenChange={(t) => {
            setToken(t)
            setValue('')
          }}
          price={token?.usd}
          balance={token?.balance}
          onMax={setValue}
          percentages={[25, 50, 75, 100]}
        />
      </Labelled>
      <Labelled title="Empty state: no token selected (amount disabled until one is picked); the unit price shows while the amount is empty">
        <TokenAmountInput
          label="You receive"
          value={recvValue}
          onChange={setRecvValue}
          token={recv}
          tokens={TOKENS}
          disabledTokens={token ? [token.symbol] : []}
          onTokenChange={setRecv}
          price={recv?.usd}
          priceChange={recv ? 2.14 : undefined}
          balance={recv?.balance}
          onMax={setRecvValue}
        />
      </Labelled>
      <Labelled title="Insufficient balance (validateBalance, on by default)">
        <TokenAmountInput label="Send" value={overValue} onChange={setOverValue} token={TOKENS[0]} price={TOKENS[0].usd} balance={TOKENS[0].balance} onMax={setOverValue} />
      </Labelled>
      <Labelled title="Zero balance: “No balance”, Max hidden">
        <TokenAmountInput label="Deposit" value="" onChange={() => {}} token={TOKENS[4]} price={TOKENS[4].usd} balance={0n} onMax={() => {}} />
      </Labelled>
      <Labelled title="Loading balance and price">
        <Switch label="loading" checked={loading} onChange={setLoading} />
        <TokenAmountInput label="Withdraw" value="" onChange={() => {}} token={TOKENS[1]} price={TOKENS[1].usd} balance={TOKENS[1].balance} onMax={() => {}} loading={loading} />
      </Labelled>
      <Labelled title="External picker (onTokenClick → TokenPicker dialog) and read-only quote">
        <TokenAmountInput
          label="Bridge"
          value={extValue}
          onChange={setExtValue}
          token={ext}
          onTokenClick={() => setOpen(true)}
          balance={ext.balance}
          price={ext.usd}
          onMax={setExtValue}
        />
        <TokenAmountInput label="Quote (read-only)" value="58.9032" token={TOKENS[2]} readOnly balance={TOKENS[2].balance} price={1} onMax={() => {}} />
      </Labelled>
      <TokenPicker
        open={open}
        onClose={() => setOpen(false)}
        tokens={TOKENS}
        selected={ext.symbol}
        onSelect={(t) => setExt(TOKENS.find((x) => x.symbol === t.symbol) ?? TOKENS[2])}
      />
    </Stack>
  )
}

function TokenPickerDemo() {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState('ZEC')
  return (
    <Cluster gap={3}>
      <Button variant="outline" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Select token
      </Button>
      <span className="nui-text-small nui-text-secondary">Selected: {picked}</span>
      <TokenPicker
        open={open}
        onClose={() => setOpen(false)}
        tokens={TOKENS}
        selected={picked}
        disabled={['ETH']}
        popular={['ZEC', 'USDC', 'NEAR']}
        onSelect={(t) => {
          setPicked(t.symbol)
          setOpen(false)
        }}
      />
    </Cluster>
  )
}

function SwapDemo() {
  const [pair, setPair] = useState<[SampleToken, SampleToken]>([TOKENS[0], TOKENS[2]])
  const [a, setA] = useState('2')
  const rate = pair[0].usd / pair[1].usd
  const b = a ? (Number(a) * rate).toFixed(Math.min(4, pair[1].decimals)) : ''
  return (
    <Stack gap={5} style={{ maxWidth: 440 }}>
      <div>
        <TokenAmountInput label="From" value={a} onChange={setA} token={pair[0]} balance={pair[0].balance} onMax={setA} fiat={usd(a, pair[0])} />
        <SwapSwitch
          onClick={() => {
            setPair(([x, y]) => [y, x])
            setA(b)
          }}
        />
        <TokenAmountInput label="To" value={b} token={pair[1]} readOnly fiat={usd(b, pair[1])} />
      </div>
      <DetailList
        items={[
          { label: 'Rate', value: `1 ${pair[0].symbol} = ${rate.toFixed(4)} ${pair[1].symbol}` },
          { label: 'Slippage', value: '0.5%' },
        ]}
      />
      <Button variant="solid" block disabled={!a}>
        Swap
      </Button>
    </Stack>
  )
}

function HealthDemo() {
  const [v, setV] = useState('2.41')
  const value = v === 'inf' ? Infinity : Number(v)
  return (
    <Stack gap={5} style={{ maxWidth: 420 }}>
      <Segmented
        label="Scenario"
        value={v}
        onChange={setV}
        options={[
          { value: 'inf', label: 'No debt' },
          { value: '2.41', label: 'Safe' },
          { value: '1.32', label: 'At risk' },
          { value: '0.94', label: 'Liquidatable' },
        ]}
      />
      <HealthFactor value={value} />
      <DetailList
        items={[
          { label: 'Collateral', value: '12.5 ZEC' },
          { label: 'Borrowed', value: value === Infinity ? '0 USDC' : `${Math.round(589 / value)} USDC` },
          { label: 'Liquidation at', value: 'HF < 1.00' },
        ]}
      />
    </Stack>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'TokenAmountInput',
    group: 'defi',
    className: 'nui-token-input',
    description:
      'Amount + token selector in one group. value is the decimal string as typed; onChange receives sanitizeAmountInput output; onMax / percent picks receive formatUnits strings, never bigints. With `price` the fiat line is computed with exact decimal math (no floats). With `tokens` the token button opens a built-in searchable dropdown (↑/↓, Enter, Esc); without them onTokenClick opens your own picker. No token → accent "Select token" and a disabled amount; balance 0n → "No balance"; amounts above the balance are invalid ("Insufficient balance").',
    Demo: TokenAmountInputDemo,
    usage: `const [value, setValue] = useState('')
const [token, setToken] = useState<PickerToken | null>(null)

<TokenAmountInput
  label="You pay"
  value={value}
  onChange={setValue}
  token={token}
  tokens={tokens}            // built-in dropdown
  onTokenChange={setToken}
  price={47.12}              // → "≈ $58.90"
  balance={token?.balance}
  onMax={setValue}
  percentages={[25, 50, 75, 100]}
/>`,
    props: [
      ['value', 'string (decimal)'],
      ['onChange', '(sanitized: string) => void'],
      ['token', '{ symbol, name?, decimals?, src? } | null — null shows the empty state'],
      ['tokens / onTokenChange', 'PickerToken[] / (token) => void — built-in dropdown'],
      ['popularTokens / disabledTokens', 'string[] (symbols) for the dropdown'],
      ['onTokenClick', '() => void — external picker when tokens is absent'],
      ['label', 'ReactNode'],
      ['aside', 'ReactNode — e.g. PrivacyBadge'],
      ['price / currency', "number | decimal string / ISO code = 'USD'"],
      ['priceChange', 'number (percent) — shown with the unit price'],
      ['fiat', 'ReactNode — overrides the computed line'],
      ['balance', 'bigint (base units); 0n → "No balance"'],
      ['decimals', 'number = token.decimals ?? 8'],
      ['onMax', '(value: string) => void'],
      ['percentages', 'number[] — e.g. [25, 50, 75, 100]; 100 is labelled Max'],
      ['validateBalance', 'boolean = true — "Insufficient balance"'],
      ['error', 'ReactNode — custom bottom-row error, implies invalid'],
      ['loading', 'boolean — skeletons for balance and fiat'],
      ['readOnly / invalid / disabled', 'boolean'],
    ],
  },
  {
    name: 'TokenPicker',
    group: 'defi',
    className: 'nui-token-list',
    description:
      'Dialog with an autofocused search and a listbox of tokens (icon, symbol, name, balance). ↑/↓ move the active option, Enter selects, Esc closes; disabled tokens are aria-disabled.',
    Demo: TokenPickerDemo,
    usage: `<TokenPicker open={open} onClose={close} tokens={tokens} selected="ZEC" onSelect={(t) => { setToken(t); close() }} />`,
    props: [
      ['open', 'boolean'],
      ['onClose', '() => void'],
      ['tokens', '{ symbol, name, decimals, balance?: bigint, src? }[]'],
      ['onSelect', '(token) => void'],
      ['selected', 'string (symbol)'],
      ['disabled', 'string[] (symbols)'],
      ['popular', 'string[] (symbols shown as quick picks)'],
    ],
  },
  {
    name: 'SwapSwitch',
    group: 'defi',
    className: 'nui-swap-switch',
    description: '36×36 switch overlapping the two inputs (margin −14px auto); the icon rotates 180° on hover. Accessible name defaults to "Switch tokens".',
    Demo: SwapDemo,
    usage: `<TokenAmountInput … />\n<SwapSwitch onClick={flip} />\n<TokenAmountInput … readOnly />`,
    props: [['label', 'string = m.switchTokens']],
  },
  {
    name: 'HealthFactor',
    group: 'defi',
    className: 'nui-health',
    description:
      'Lending health: value coloured by zone (safe / at risk / liquidatable), a 6px three-zone track and a 2×14 marker. role="meter" with aria-valuetext like "2.41, safe". Infinity means no debt.',
    Demo: HealthDemo,
    usage: `<HealthFactor value={2.41} />`,
    props: [
      ['value', 'number (Infinity = no debt)'],
      ['liquidation', 'number = 1'],
      ['warning', 'number = 1.5'],
      ['max', 'number = 3 (track end)'],
      ['label', 'ReactNode = m.healthFactor'],
    ],
  },
  {
    name: 'DetailList',
    group: 'defi',
    className: 'nui-detail-list',
    description: 'Label / value rows (13px, values right-aligned and tabular) for rates, routes, slippage and fees. Also used by the zcash group.',
    Demo: () => (
      <div style={{ maxWidth: 380 }}>
        <DetailList
          items={[
            { label: 'Route', value: 'ZEC → nZEC → USDC' },
            { label: 'Rate', value: '1 ZEC = 47.08 USDC' },
            { label: 'Price impact', value: <span style={{ color: 'var(--nui-warning)' }}>1.84%</span> },
            { label: 'Network fee', value: '0.0001 ZEC' },
            { label: 'Privacy', value: <PrivacyBadge level="confidential" /> },
          ]}
        />
      </div>
    ),
    usage: `<DetailList items={[{ label: 'Slippage', value: '0.5%' }, { label: 'Fee', value: '0.0001 ZEC' }]} />`,
    props: [['items', '{ label: ReactNode; value: ReactNode; key?: string }[]']],
  },
]
