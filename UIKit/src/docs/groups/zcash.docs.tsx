import { useEffect, useState } from 'react'
import {
  Address,
  Alert,
  Amount,
  Button,
  buildPaymentUri,
  ChainBadge,
  Cluster,
  CopyButton,
  DataTable,
  Field,
  MemoInput,
  MEMO_MAX_BYTES,
  memoByteLength,
  Hash,
  PoolBadge,
  PriceChange,
  PrivacyBadge,
  ReceiveQR,
  Segmented,
  Stack,
  SyncProgress,
  TokenIcon,
  TokenPair,
  TxStatus,
  useCopy,
  useNuiLocale,
  usePrivacyLevel,
  type PrivacyLevel,
  type TxStatusValue,
} from '../../nui3'
import { ADDR, TOKENS, TXID } from '../sample'
import type { ComponentDoc } from '../types'

const Label = ({ children }: { children: string }) => <p className="nui-eyebrow">{children}</p>

function AddressDemo() {
  const [full, setFull] = useState(false)
  return (
    <Stack gap={4}>
      <Segmented label="Display" value={full ? 'full' : 'short'} onChange={(v) => setFull(v === 'full')} options={[{ value: 'short', label: 'Truncated' }, { value: 'full', label: 'Full' }]} />
      <Stack gap={3}>
        <Address address={ADDR.unified} full={full} />
        <Address address={ADDR.sapling} full={full} />
        <Address address={ADDR.tex} full={full} />
        <Address address={ADDR.transparent} full={full} />
        <Address address={ADDR.unified} truncate={[12, 10]} copyable={false} />
      </Stack>
    </Stack>
  )
}

function CopyDemo() {
  const { copied, copy } = useCopy()
  const [count, setCount] = useState(0)
  return (
    <Stack gap={4}>
      <Cluster gap={3}>
        <span className="nui-mono">{TXID.slice(0, 16)}…</span>
        <CopyButton value={TXID} label="Copy transaction id" onCopy={() => setCount((c) => c + 1)} />
      </Cluster>
      <Cluster gap={3}>
        <Button size="sm" variant="outline" onClick={() => copy(ADDR.unified)}>
          {copied ? 'Copied' : 'Copy receive address'}
        </Button>
        <span className="nui-text-small nui-text-muted">useCopy → copied: {String(copied)} · CopyButton copies: {count}</span>
      </Cluster>
    </Stack>
  )
}

function AmountDemo() {
  const [hidden, setHidden] = useState(true)
  return (
    <Stack gap={4}>
      <Cluster gap={3}>
        <Amount value={250_000_000n} size="lg" hidden={hidden} fiat={117.8} />
        <Button size="sm" variant="ghost" onClick={() => setHidden((h) => !h)} aria-pressed={!hidden}>
          {hidden ? 'Reveal' : 'Hide'}
        </Button>
      </Cluster>
      <Stack gap={2} className="nui-text-small">
        <span>
          Tiny balance (1 zatoshi): <Amount value={1n} />
        </span>
        <span>
          Received: <Amount value={12_345_678_901n} sign="auto" />
        </span>
        <span>
          Sent: <Amount value={-50_000_000n} sign="auto" />
        </span>
        <span>
          Exact (confirmation page): <Amount value={123_456_789n} exact />
        </span>
        <span>
          USDC, 6 decimals: <Amount value={1_520_450_000n} decimals={6} symbol="USDC" />
        </span>
        <span>
          No unit: <Amount value={0n} symbol={null} />
        </span>
      </Stack>
    </Stack>
  )
}

function PrivacyDemo() {
  return (
    <Stack gap={4}>
      <Cluster gap={3}>
        <PrivacyBadge level="shielded" describe />
        <PrivacyBadge level="confidential" describe />
        <PrivacyBadge level="public" describe />
      </Cluster>
      <Label>Bridge: privacy changes between steps</Label>
      <Cluster gap={2}>
        <PrivacyBadge level="shielded" />
        <span aria-hidden="true">→</span>
        <PrivacyBadge level="public" label="Public · NEAR" />
      </Cluster>
      <Alert tone="warning" title="Privacy changes at the bridge.">
        ZEC leaves the Zcash shielded pool when it is minted on NEAR. From that step on, the address, amount and history are public.
      </Alert>
    </Stack>
  )
}

const STATUSES: TxStatusValue[] = ['pending', 'confirming', 'confirmed', 'failed', 'expired', 'refunded']

function TxStatusDemo() {
  const [conf, setConf] = useState(0)
  useEffect(() => {
    if (conf >= 10) return
    const id = setTimeout(() => setConf((c) => c + 1), 900)
    return () => clearTimeout(id)
  }, [conf])
  const live: TxStatusValue = conf === 0 ? 'pending' : conf < 10 ? 'confirming' : 'confirmed'
  return (
    <Stack gap={4}>
      <Cluster gap={4}>
        {STATUSES.map((s) => (
          <TxStatus key={s} status={s} />
        ))}
      </Cluster>
      <Cluster gap={3}>
        <TxStatus status={live} confirmations={conf} required={10} />
        <Button size="sm" variant="ghost" onClick={() => setConf(0)}>
          Replay
        </Button>
      </Cluster>
    </Stack>
  )
}

interface ExplorerRow {
  id: string
  privacy: PrivacyLevel
  status: TxStatusValue
  amount?: bigint
  from?: string
}

const EXPLORER: ExplorerRow[] = [
  { id: TXID, privacy: 'shielded', status: 'confirmed' },
  { id: TXID.split('').reverse().join(''), privacy: 'public', status: 'confirmed', amount: 125_000_000n, from: ADDR.transparent },
  { id: TXID.replace(/a/g, 'c'), privacy: 'shielded', status: 'pending' },
]

/** R7: public pages never reveal shielded data. */
function PublicExplorerDemo() {
  const { t } = useNuiLocale()
  const hidden = <span className="nui-text-muted">{t('Hidden by shielded pool', '被屏蔽池隐藏')}</span>
  return (
    <DataTable<ExplorerRow>
      caption="Recent transactions (public explorer)"
      rowKey="id"
      rows={EXPLORER}
      columns={[
        { key: 'id', header: 'Tx', cell: (r) => <Hash value={r.id} href="#/c/hash" copyable={false} /> },
        { key: 'privacy', header: 'Pool', cell: (r) => <PrivacyBadge level={r.privacy} /> },
        { key: 'from', header: 'From', cell: (r) => (r.privacy === 'shielded' ? hidden : <Address address={r.from!} copyable={false} />) },
        {
          key: 'amount',
          header: 'Amount',
          numeric: true,
          cell: (r) => (r.privacy === 'shielded' ? <span className="nui-text-secondary">{t('Shielded', '屏蔽')}</span> : <Amount value={r.amount!} />),
        },
        { key: 'status', header: 'Status', cell: (r) => <TxStatus status={r.status} /> },
      ]}
    />
  )
}

function SyncDemo() {
  const tip = 3_120_442
  const start = 2_400_000
  const [scanned, setScanned] = useState(2_980_000)
  useEffect(() => {
    if (scanned >= tip) return
    const id = setTimeout(() => setScanned((s) => Math.min(tip, s + 9_000)), 120)
    return () => clearTimeout(id)
  }, [scanned])
  const left = Math.ceil((tip - scanned) / 9_000 / 8)
  return (
    <Stack gap={4} style={{ maxWidth: 420 }}>
      <SyncProgress scanned={scanned} tip={tip} start={start} eta={`≈ ${left} s`} />
      <Cluster>
        <Button size="sm" variant="ghost" onClick={() => setScanned(2_700_000)}>
          Rescan
        </Button>
      </Cluster>
    </Stack>
  )
}

function MemoDemo() {
  const { m } = useNuiLocale()
  const [to, setTo] = useState<'unified' | 'transparent'>('unified')
  const [memo, setMemo] = useState('Invoice 2041 · 季度付款 ✓')
  const over = memoByteLength(memo) > MEMO_MAX_BYTES
  return (
    <Stack gap={4} style={{ maxWidth: 480 }}>
      <Segmented
        label="Recipient"
        value={to}
        onChange={setTo}
        options={[
          { value: 'unified', label: 'Unified recipient' },
          { value: 'transparent', label: 'Transparent recipient' },
        ]}
      />
      <Address address={ADDR[to]} />
      <Field label="Memo" error={over && to === 'unified' ? m.memoTooLong : undefined}>
        <MemoInput value={memo} onChange={setMemo} recipient={ADDR[to]} />
      </Field>
      <Cluster gap={2}>
        <Button size="sm" variant="ghost" onClick={() => setMemo('Payroll October · '.repeat(32))}>
          Fill over limit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setMemo('')}>
          Clear
        </Button>
      </Cluster>
    </Stack>
  )
}

function ReceiveDemo() {
  const [mode, setMode] = useState<'address' | 'uri'>('address')
  const uri = buildPaymentUri({ address: ADDR.unified, amount: '1.25', memo: 'Invoice 2041' })
  return (
    <Stack gap={4}>
      <Segmented
        label="QR content"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'address', label: 'Address' },
          { value: 'uri', label: 'ZIP-321 request' },
        ]}
      />
      <Cluster gap={6} style={{ alignItems: 'flex-start' }}>
        <ReceiveQR value={mode === 'address' ? ADDR.unified : uri} caption={mode === 'address' ? 'Unified address' : '1.25 ZEC · Invoice 2041'} />
        <Stack gap={2} style={{ minWidth: 0, maxWidth: 360 }}>
          <Label>{mode === 'address' ? 'Address' : 'Payment URI'}</Label>
          {mode === 'address' ? <Address address={ADDR.unified} full /> : <code className="nui-mono" style={{ wordBreak: 'break-all' }}>{uri}</code>}
        </Stack>
      </Cluster>
    </Stack>
  )
}

function PrivacyLevelDemo() {
  const [level, setLevel] = useState<PrivacyLevel>('confidential')
  const info = usePrivacyLevel(level)
  return (
    <Stack gap={3}>
      <Segmented label="Privacy level" value={level} onChange={setLevel} options={['shielded', 'confidential', 'public']} />
      <p className="nui-text-small">
        <strong>{info.label}</strong> — <span className="nui-text-secondary">{info.description}</span>
      </p>
    </Stack>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'Address',
    group: 'zcash',
    className: 'nui-address',
    description:
      'Kind label derived via parseAddress (Unified and Sapling use the shielded colour) + middle truncation (8…6) + copy. Copy always copies the full value; the full value is in title and the screen-reader text.',
    Demo: AddressDemo,
    usage: `import { Address } from '@nui3/react'\n\n<Address address={ua} />\n<Address address={ua} full />   // receive / detail pages`,
    props: [
      ['address', 'string'],
      ['truncate', '[head, tail] | false = [8, 6]'],
      ['copyable', 'boolean = true'],
      ['showKind', 'boolean = true'],
      ['href', 'string'],
      ['full', 'boolean — whole value, wraps (word-break: break-all)'],
    ],
  },
  {
    name: 'Hash',
    group: 'zcash',
    className: 'nui-hash',
    description: 'txid / block hash / state root. Same anatomy as Address without the kind label; with href the text is an internal link.',
    Demo: () => (
      <Stack gap={3}>
        <Hash value={TXID} />
        <Hash value={TXID} href="#/c/hash" truncate={[12, 12]} />
        <Hash value={TXID} truncate={false} copyable={false} />
      </Stack>
    ),
    usage: `<Hash value={txid} href={\`/tx/\${txid}\`} />`,
    props: [
      ['value', 'string'],
      ['truncate', '[head, tail] | false = [8, 6]'],
      ['copyable', 'boolean = true'],
      ['href', 'string'],
    ],
  },
  {
    name: 'CopyButton / useCopy',
    group: 'zcash',
    className: 'nui-copy',
    description: '24×24 copy icon button. The copied state lasts 1.5s (data-copied, positive colour) and "Copied" is announced in a polite live region.',
    Demo: CopyDemo,
    usage: `<CopyButton value={txid} label={m.copyHash} />\n\nconst { copied, copy } = useCopy()\n<Button onClick={() => copy(address)}>{copied ? m.copied : m.copy}</Button>`,
    props: [
      ['value', 'string — copied verbatim'],
      ['label', 'string (required, aria-label)'],
      ['onCopy', '(value: string) => void'],
      ['useCopy(timeout = 1500)', '→ { copied: boolean, copy(value): Promise<boolean> }'],
    ],
  },
  {
    name: 'Amount',
    group: 'zcash',
    className: 'nui-amount',
    description:
      'bigint base units in, ≤ 4 decimals out (formatAmount). Tiny non-zero values show <0.0001, never 0. hidden renders •••••• (aria-hidden) plus a screen-reader "Amount hidden"; title carries the exact value except when hidden.',
    Demo: AmountDemo,
    usage: `<Amount value={250_000_000n} fiat={117.8} />\n<Amount value={delta} sign="auto" />\n<Amount value={balance} hidden={privacyMode} size="lg" />`,
    props: [
      ['value', 'bigint (base units)'],
      ['decimals', 'number = 8'],
      ['symbol', "string | null = 'ZEC'"],
      ['exact', 'boolean — full precision'],
      ['fiat', 'number | ReactNode'],
      ['currency', "string = 'USD'"],
      ['hidden', 'boolean'],
      ['sign', "'auto' | 'none' = 'none'"],
      ['size', "'md' | 'lg'"],
    ],
  },
  {
    name: 'PriceChange',
    group: 'zcash',
    className: 'nui-delta',
    description: 'Percent change: ▲ green / ▼ red, with an "increase" / "decrease" screen-reader word.',
    Demo: () => (
      <Cluster gap={5}>
        <PriceChange value={3.42} />
        <PriceChange value={-1.2} />
        <PriceChange value={0} />
        <span>
          ZEC <strong className="nui-num">$47.12</strong> <PriceChange value={2.05} />
        </span>
      </Cluster>
    ),
    usage: `<PriceChange value={3.42} />  // ▲ 3.42%`,
    props: [
      ['value', 'number (percent units)'],
      ['digits', 'number = 2'],
    ],
  },
  {
    name: 'PrivacyBadge',
    group: 'zcash',
    className: 'nui-privacy',
    description:
      'Exactly three levels, never interchangeable (R6): shielded (Zcash shielded pool), confidential (Noir execution, not Zcash cryptography), public (dashed border). When privacy changes across a flow, show both badges and a warning Alert.',
    Demo: PrivacyDemo,
    usage: `<PrivacyBadge level="shielded" />\n<PrivacyBadge level="confidential" describe />`,
    props: [
      ['level', "'shielded' | 'confidential' | 'public'"],
      ['describe', 'boolean — Tooltip with the privacy*Desc text'],
      ['label', 'ReactNode — override visible text'],
    ],
  },
  {
    name: 'PoolBadge',
    group: 'zcash',
    className: 'nui-pool',
    description: 'Zcash value pool with an 8px marker: Orchard solid, Sapling 2px ring, Transparent 1px ring.',
    Demo: () => (
      <Cluster gap={5}>
        <PoolBadge pool="orchard" />
        <PoolBadge pool="sapling" />
        <PoolBadge pool="transparent" />
      </Cluster>
    ),
    usage: `<PoolBadge pool="orchard" />`,
    props: [['pool', "'orchard' | 'sapling' | 'transparent'"]],
  },
  {
    name: 'ChainBadge',
    group: 'zcash',
    className: 'nui-chain',
    description: 'Chain name only (13px / 500), with an optional icon. Pair with a PrivacyBadge when privacy matters.',
    Demo: () => (
      <Cluster gap={5}>
        <ChainBadge chain="Zcash" icon={<TokenIcon symbol="ZEC" size="sm" />} />
        <ChainBadge chain="NEAR" icon={<TokenIcon symbol="NEAR" size="sm" />} />
        <ChainBadge chain="Ethereum" />
      </Cluster>
    ),
    usage: `<ChainBadge chain="NEAR" icon={<TokenIcon symbol="NEAR" size="sm" />} />`,
    props: [
      ['chain', 'string'],
      ['icon', 'ReactNode'],
    ],
  },
  {
    name: 'TokenIcon / TokenPair',
    group: 'zcash',
    className: 'nui-token-icon',
    description: 'Round token icon (18 / 24 / 36px) with a letter fallback; ZEC uses the gold fill. TokenPair overlaps two icons by 30% with a 2px surface ring.',
    Demo: () => (
      <Stack gap={4}>
        <Cluster gap={3}>
          {TOKENS.map((t) => (
            <TokenIcon key={t.symbol} symbol={t.symbol} label={t.name} />
          ))}
        </Cluster>
        <Cluster gap={3}>
          <TokenIcon symbol="ZEC" size="sm" />
          <TokenIcon symbol="ZEC" />
          <TokenIcon symbol="ZEC" size="lg" />
        </Cluster>
        <Cluster gap={5}>
          <TokenPair base="ZEC" quote="USDC" size="sm" />
          <TokenPair base="ZEC" quote="USDC" />
          <TokenPair base="nZEC" quote="NEAR" size="lg" label="nZEC / NEAR" />
        </Cluster>
      </Stack>
    ),
    usage: `<TokenIcon symbol="ZEC" />\n<TokenPair base="ZEC" quote="USDC" size="lg" />`,
    props: [
      ['symbol', 'string'],
      ['src', 'string — image URL'],
      ['size', "'sm' | 'md' | 'lg'"],
      ['label', 'string — accessible name when standalone (else decorative)'],
      ['TokenPair base / quote', 'string (+ baseSrc / quoteSrc)'],
    ],
  },
  {
    name: 'TxStatus',
    group: 'zcash',
    className: 'nui-tx-status',
    description:
      'Status dot + label (pending / confirming pulse in warning, confirmed positive, failed / expired negative, refunded info), optional "3 / 10" confirmations; aria-live="polite". The table below shows the R7 public-page rule: shielded rows show "Shielded" and "Hidden by shielded pool".',
    Demo: () => (
      <Stack gap={6}>
        <TxStatusDemo />
        <Label>Public explorer (R7)</Label>
        <PublicExplorerDemo />
      </Stack>
    ),
    usage: `<TxStatus status="confirming" confirmations={3} required={10} />`,
    props: [
      ['status', "'pending' | 'confirming' | 'confirmed' | 'failed' | 'expired' | 'refunded'"],
      ['confirmations', 'number'],
      ['required', 'number'],
    ],
  },
  {
    name: 'SyncProgress',
    group: 'zcash',
    className: 'nui-sync',
    description: 'Wallet scan progress: Syncing / Synced + percent, scanned / tip heights, scan range and ETA, with a Progress bar.',
    Demo: SyncDemo,
    usage: `<SyncProgress scanned={2_980_000} tip={3_120_442} start={birthday} eta="≈ 4 min" />`,
    props: [
      ['scanned', 'number — scanned height'],
      ['tip', 'number — chain tip'],
      ['start', 'number = 0 — wallet birthday'],
      ['eta', 'ReactNode — formatted by the app'],
    ],
  },
  {
    name: 'MemoInput',
    group: 'zcash',
    className: 'nui-memo',
    description:
      'Encrypted memo with a UTF-8 byte counter (n/512 bytes, multi-byte characters count as bytes). Over the limit the counter turns negative and the field is invalid, but the text is never truncated. A transparent recipient disables it with the memoTransparent hint. Joins a surrounding Field.',
    Demo: MemoDemo,
    usage: `<Field label="Memo" error={tooLong ? m.memoTooLong : undefined}>\n  <MemoInput value={memo} onChange={setMemo} recipient={address} />\n</Field>`,
    props: [
      ['value', 'string'],
      ['onChange', '(value: string) => void'],
      ['recipient', 'string — transparent / TEX disables the memo'],
      ['maxBytes', 'number = 512'],
      ['…', 'Textarea props (rows = 3, placeholder = m.memoPlaceholder)'],
    ],
  },
  {
    name: 'ReceiveQR',
    group: 'zcash',
    className: 'nui-qr',
    description: 'QR for an address or a ZIP-321 URI (buildPaymentUri). The quiet zone is always white, also in the night theme; the svg is labelled "QR code for …".',
    Demo: ReceiveDemo,
    usage: `<ReceiveQR value={buildPaymentUri({ address, amount: '1.25', memo })} caption="1.25 ZEC" />`,
    props: [
      ['value', 'string — address or ZIP-321 URI'],
      ['size', 'number = 200 (px, --nui-qr-size)'],
      ['caption', 'ReactNode'],
      ['errorCorrection', "'L' | 'M' | 'Q' | 'H' = 'M'"],
    ],
  },
  {
    name: 'usePrivacyLevel',
    group: 'zcash',
    className: '',
    description: 'Hook returning the localised { label, description } of a privacy level, with the fixed R6 wording.',
    Demo: PrivacyLevelDemo,
    usage: `const { label, description } = usePrivacyLevel('confidential')`,
    props: [['usePrivacyLevel(level)', '→ { level, label, description }']],
  },
]
