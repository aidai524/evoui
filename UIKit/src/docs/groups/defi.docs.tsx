import { useState } from 'react'
import {
  Button,
  Cluster,
  DetailList,
  formatFiat,
  HealthFactor,
  PrivacyBadge,
  Segmented,
  Stack,
  SwapSwitch,
  TokenAmountInput,
  TokenPicker,
  tryParseUnits,
} from '../../nui3'
import { TOKENS, type SampleToken } from '../sample'
import type { ComponentDoc } from '../types'

const usd = (value: string, t?: SampleToken) => {
  const n = Number(value || 0) * (t?.usd ?? 0)
  return n ? `≈ ${formatFiat(n)}` : undefined
}

function TokenAmountInputDemo() {
  const [value, setValue] = useState('1.25')
  const [token, setToken] = useState<SampleToken | null>(TOKENS[0])
  const [open, setOpen] = useState(false)
  const units = token ? tryParseUnits(value, token.decimals) : null
  const over = !!token && units != null && units > token.balance
  return (
    <Stack gap={5} style={{ maxWidth: 440 }}>
      <TokenAmountInput
        label="You pay"
        aside={<PrivacyBadge level="shielded" />}
        value={value}
        onChange={setValue}
        token={token}
        onTokenClick={() => setOpen(true)}
        balance={token?.balance}
        onMax={setValue}
        fiat={usd(value, token ?? undefined)}
        invalid={over}
      />
      {over && <p className="nui-text-small" style={{ color: 'var(--nui-negative)' }}>Amount exceeds your balance.</p>}
      <TokenAmountInput label="You receive" value="" token={null} onTokenClick={() => setOpen(true)} readOnly />
      <TokenAmountInput label="Quote (read-only)" value="58.9032" token={TOKENS[2]} readOnly balance={TOKENS[2].balance} onMax={() => {}} />
      <TokenPicker
        open={open}
        onClose={() => setOpen(false)}
        tokens={TOKENS}
        selected={token?.symbol}
        onSelect={(t) => {
          setToken(TOKENS.find((x) => x.symbol === t.symbol) ?? null)
          setOpen(false)
        }}
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
      'Amount + token selector in one group. value is the decimal string as typed; onChange receives sanitizeAmountInput output; onMax receives formatUnits(balance) (a string, never a bigint). Parse with parseUnits only on submit. Without a token the select uses the accent fill.',
    Demo: TokenAmountInputDemo,
    usage: `const [value, setValue] = useState('')\n\n<TokenAmountInput\n  label="You pay"\n  value={value}\n  onChange={setValue}\n  token={zec}\n  onTokenClick={() => setPickerOpen(true)}\n  balance={zec.balance}\n  onMax={setValue}\n/>`,
    props: [
      ['value', 'string (decimal)'],
      ['onChange', '(sanitized: string) => void'],
      ['token', '{ symbol, name?, decimals?, src? } | null'],
      ['onTokenClick', '() => void'],
      ['label', 'ReactNode'],
      ['aside', 'ReactNode — e.g. PrivacyBadge'],
      ['fiat', 'ReactNode — "≈ $117.40"'],
      ['balance', 'bigint (base units)'],
      ['decimals', 'number = token.decimals ?? 8'],
      ['onMax', '(value: string) => void'],
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
