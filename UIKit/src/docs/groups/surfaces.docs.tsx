import { useState } from 'react'
import {
  PrivacyBadge,
  type PrivacyLevel,
  Alert,
  Badge,
  Button,
  Card,
  CardLink,
  Cluster,
  DataTable,
  EmptyState,
  Grid,
  KeyValue,
  Panel,
  Progress,
  ProjectCard,
  Segmented,
  Skeleton,
  Stack,
  Stat,
  Stats,
  Stepper,
  formatAmount,
  truncateMiddle,
  type DataTableColumn,
} from '../../nui3'
import { ADDR, TXID } from '../sample'
import type { ComponentDoc } from '../types'

/* ── Sample explorer rows (public page: shielded rows never show amounts — R7) ── */
interface TxRow {
  height: number
  hash: string
  kind: 'shielded' | 'transparent' | 'mixed'
  /** zatoshi; null when hidden by the shielded pool */
  amount: bigint | null
  fee: bigint
  age: number
}
const hex = (n: number) => (TXID.slice(n) + TXID.slice(0, n)).slice(0, 64)
const TX_ROWS: TxRow[] = [
  { height: 3_104_221, hash: hex(0), kind: 'shielded', amount: null, fee: 10_000n, age: 2 },
  { height: 3_104_220, hash: hex(9), kind: 'transparent', amount: 1_250_000_000n, fee: 15_000n, age: 4 },
  { height: 3_104_220, hash: hex(17), kind: 'mixed', amount: 48_500_000n, fee: 10_000n, age: 4 },
  { height: 3_104_219, hash: hex(23), kind: 'shielded', amount: null, fee: 20_000n, age: 7 },
  { height: 3_104_217, hash: hex(31), kind: 'transparent', amount: 7_000n, fee: 10_000n, age: 12 },
  { height: 3_104_214, hash: hex(40), kind: 'transparent', amount: 312_004_500n, fee: 10_000n, age: 19 },
]
// R6: only shielded / confidential / public. A t→z shielding tx exposes its amount, so it is public.
const LEVEL: Record<TxRow['kind'], PrivacyLevel> = { shielded: 'shielded', transparent: 'public', mixed: 'public' }
const HIDDEN = 'Hidden by shielded pool'

const txColumns: DataTableColumn<TxRow>[] = [
  { key: 'height', header: 'Block', numeric: true, sortValue: (r) => r.height, cell: (r) => r.height.toLocaleString('en-US') },
  {
    key: 'hash',
    header: 'Transaction',
    cell: (r) => (
      <a className="nui-link nui-mono" href={`#tx-${r.hash.slice(0, 8)}`} title={r.hash}>
        {truncateMiddle(r.hash, 8, 6)}
      </a>
    ),
  },
  {
    key: 'kind',
    header: 'Privacy',
    sortValue: (r) => r.kind,
    cell: (r) => (
      <PrivacyBadge level={LEVEL[r.kind]} />
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    numeric: true,
    sortValue: (r) => r.amount,
    cell: (r) => (r.amount == null ? <span className="nui-text-muted">Shielded</span> : `${formatAmount(r.amount)} ZEC`),
  },
  { key: 'fee', header: 'Fee', numeric: true, sortValue: (r) => r.fee, cell: (r) => `${formatAmount(r.fee)} ZEC` },
  { key: 'age', header: 'Age', numeric: true, sortValue: (r) => r.age, cell: (r) => `${r.age} min` },
]

function DataTableDemo() {
  const [state, setState] = useState<'data' | 'loading' | 'empty' | 'error'>('data')
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <Stack gap={4}>
      <Segmented
        label="Table state"
        value={state}
        onChange={setState}
        options={[
          { value: 'data', label: 'Data' },
          { value: 'loading', label: 'Loading' },
          { value: 'empty', label: 'Empty' },
          { value: 'error', label: 'Error' },
        ]}
      />
      {state === 'error' ? (
        <Alert tone="negative" title="Could not load recent transactions." action={<Button size="sm" variant="outline" onClick={() => setState('data')}>Retry</Button>}>
          The indexer did not respond within 10 s. Sample data.
        </Alert>
      ) : (
        <DataTable
          caption="Recent transactions"
          columns={txColumns}
          rows={state === 'empty' ? [] : TX_ROWS}
          rowKey="hash"
          loading={state === 'loading'}
          defaultSort={{ key: 'height', direction: 'descending' }}
          onRowClick={(r) => setSelected(r.hash)}
          rowSelected={(r) => r.hash === selected}
          empty={<EmptyState title="No transactions yet." hint="Transactions in this block range will appear here once the indexer has seen them." action={<Button variant="outline" onClick={() => setState('data')}>Reset range</Button>} />}
        />
      )}
      <p className="nui-text-small nui-text-muted">
        Sample data. Click Block, Privacy, Amount, Fee or Age to sort; shielded rows sort last by amount because it is {HIDDEN.toLowerCase()}.
      </p>
    </Stack>
  )
}

const logo = (t: string) => <span aria-hidden="true">{t}</span>

export const docs: ComponentDoc[] = [
  {
    name: 'Card',
    group: 'surfaces',
    className: 'nui-card',
    description:
      'Bordered surface with zero shadow. Interactive cards grow a 2px accent rule from the left on hover/focus and are made clickable with one stretched link, so screen readers hear a single link.',
    Demo: () => (
      <Grid cols={2}>
        <Card>
          <div className="nui-card__head">
            <span className="nui-card__logo">{logo('RP')}</span>
            <h3 className="nui-card__title">RPC node</h3>
          </div>
          <p className="nui-card__desc">Static card. Light-client endpoint with compact block streaming. No link, so no hover rule and no pointer cursor.</p>
          <div className="nui-card__foot">
            <ul className="nui-card__tags">
              <li>Infra</li>
              <li>Public</li>
            </ul>
          </div>
        </Card>
        <Card interactive>
          <span className="nui-card__index" aria-hidden="true">
            02
          </span>
          <div className="nui-card__head">
            <span className="nui-card__logo">{logo('BR')}</span>
            <h3 className="nui-card__title">Bridge</h3>
          </div>
          <p className="nui-card__desc">Interactive card: hover or Tab to the link to see the accent rule. The whole card is clickable through the stretched link.</p>
          <div className="nui-card__foot">
            <ul className="nui-card__tags">
              <li>DeFi</li>
              <li>Shielded</li>
            </ul>
            <CardLink href="#bridge" stretched>
              Open<span className="nui-sr-only"> Bridge</span>
            </CardLink>
          </div>
        </Card>
      </Grid>
    ),
    usage: `import { Card, CardLink } from '@nui3/react'

<Card interactive>
  <div className="nui-card__head"><h3 className="nui-card__title">Bridge</h3></div>
  <p className="nui-card__desc">Move ZEC to Noir.</p>
  <div className="nui-card__foot">
    <CardLink href="/bridge" stretched>Open</CardLink>
  </div>
</Card>`,
    props: [
      ['interactive', 'boolean — pointer cursor + accent hover rule'],
      ['as', "ElementType = 'article'"],
      ['CardLink stretched', 'boolean — ::before inset:0 makes the whole card clickable'],
      ['CardLink arrow', 'boolean = true'],
      ['--nui-card-lines', 'CSS var, description clamp (default 3)'],
    ],
  },
  {
    name: 'ProjectCard',
    group: 'surfaces',
    className: 'nui-card',
    description: 'Ready-made Card for app directories: logo, two-digit index, uppercase title, 3-line description, tags and one stretched link.',
    Demo: () => (
      <Grid cols={3}>
        <ProjectCard
          index={1}
          name="Shielded wallet"
          logo={logo('SW')}
          description="Send and receive ZEC from the Orchard pool. Memos are encrypted end to end."
          tags={['Wallet', 'Shielded']}
          href="#wallet"
        />
        <ProjectCard
          index={2}
          name="Noir DEX"
          logo={logo('ND')}
          description="Confidential order matching. Balances are hidden from the public but processed by the execution environment, not by Zcash shielded cryptography."
          tags={['DeFi', 'Confidential']}
          href="https://example.org/dex"
        />
        <ProjectCard index={3} name="Block explorer" logo={logo('EX')} description="Coming soon. No link, so the card is static." tags={['Infra']} />
      </Grid>
    ),
    usage: `<ProjectCard index={1} name="Shielded wallet" description="…" tags={['Wallet', 'Shielded']} href="/apps/wallet" logo={<img src={src} alt="" />} />`,
    props: [
      ['name', 'string'],
      ['description', 'ReactNode'],
      ['href', 'string — external links open in a new tab'],
      ['tags', 'string[]'],
      ['logo', 'ReactNode'],
      ['index', 'number — zero-padded, decorative'],
      ['linkLabel', 'string = m.open'],
      ['titleAs', "ElementType = 'h3'"],
    ],
  },
  {
    name: 'Panel',
    group: 'surfaces',
    className: 'nui-panel',
    description: 'Titled container: 16px × card-pad head, card-pad body, 14px foot. `flush` removes body padding for an embedded DataTable (its border collapses).',
    Demo: () => (
      <Stack gap={5}>
        <Panel title="Route health" actions={<Button size="sm">View all</Button>} footer={<span className="nui-text-muted">Updated 2 min ago · Sample data</span>}>
          <KeyValue
            items={[
              ['Median latency', '52 ms'],
              ['Success rate', '99.98%'],
            ]}
          />
        </Panel>
        <Grid cols={2}>
          <Panel title="Sunken" sunken>
            <p className="nui-text-small nui-text-secondary">Use for nested or secondary regions.</p>
          </Panel>
          <Panel title="Flush with table" flush>
            <DataTable
              columns={[
                { key: 'p', header: 'Pool', cell: (r: { p: string; v: string }) => r.p },
                { key: 'v', header: 'Value', numeric: true, cell: (r: { p: string; v: string }) => r.v },
              ]}
              rows={[
                { p: 'Orchard', v: 'Shielded' },
                { p: 'Transparent', v: '412,880.12 ZEC' },
              ]}
              rowKey="p"
            />
          </Panel>
        </Grid>
      </Stack>
    ),
    usage: `<Panel title="Positions" actions={<Button size="sm">Export</Button>} flush>
  <DataTable … />
</Panel>`,
    props: [
      ['title', 'ReactNode'],
      ['actions', 'ReactNode'],
      ['footer', 'ReactNode'],
      ['sunken', 'boolean'],
      ['flush', 'boolean — body padding 0'],
      ['titleAs', "ElementType = 'h3'"],
    ],
  },
  {
    name: 'Stats',
    group: 'surfaces',
    className: 'nui-stats',
    description: 'KPI row as a definition list. Value 40px/900 tabular; `divided` adds 1px rules (dropped ≤640px).',
    Demo: () => (
      <Stack gap={8}>
        <Stats divided>
          <Stat label="Shielded supply" value="4.21" unit="M ZEC" />
          <Stat label="Median fee" value="0.0001" unit="ZEC" />
          <Stat label="Block height" value="3,104,221" />
        </Stats>
        <Stats>
          <Stat size="sm" label="24h volume" value="$1.8M" />
          <Stat size="sm" label="Open interest" value="$640K" />
          <Stat size="sm" label="Markets" value="12" />
        </Stats>
      </Stack>
    ),
    usage: `<Stats divided>
  <Stat label="Shielded supply" value="4.21" unit="M ZEC" />
</Stats>`,
    props: [['divided', 'boolean — 1px left rules, dropped ≤640px']],
  },
  {
    name: 'Stat',
    group: 'surfaces',
    className: 'nui-stat',
    description: 'One KPI: 11px uppercase label over a 40px/900 tabular value (26px/800 when sm). Units sit in a .45em muted <small>.',
    Demo: () => (
      <Stats>
        <Stat label="Shielded supply" value="4.21" unit="M ZEC" />
        <Stat size="sm" label="Median fee" value="0.0001" unit="ZEC" />
      </Stats>
    ),
    usage: `<Stat label="Median fee" value="0.0001" unit="ZEC" size="sm" />`,
    props: [
      ['label', 'ReactNode'],
      ['value', 'ReactNode'],
      ['unit', 'ReactNode — <small> .45em'],
      ['size', "'md' | 'sm' = 'md'"],
    ],
  },
  {
    name: 'Badge',
    group: 'surfaces',
    className: 'nui-badge',
    description: '22px uppercase label. Border is the tone at 40%; `solid` adds a 12% tint; `accent` is the only filled variant.',
    Demo: () => (
      <Stack gap={3}>
        <Cluster gap={2}>
          <Badge>Neutral</Badge>
          <Badge tone="positive">Confirmed</Badge>
          <Badge tone="negative">Failed</Badge>
          <Badge tone="warning">At risk</Badge>
          <Badge tone="info">Beta</Badge>
          <Badge tone="accent">New</Badge>
        </Cluster>
        <Cluster gap={2}>
          <Badge dot solid>
            Neutral
          </Badge>
          <Badge tone="positive" dot solid>
            Operational
          </Badge>
          <Badge tone="negative" dot solid>
            Outage
          </Badge>
          <Badge tone="warning" dot solid>
            Degraded
          </Badge>
          <Badge tone="info" dot solid>
            Syncing
          </Badge>
        </Cluster>
      </Stack>
    ),
    usage: `<Badge tone="positive" dot>Operational</Badge>`,
    props: [
      ['tone', "'neutral' | 'positive' | 'negative' | 'warning' | 'info' | 'accent' = 'neutral'"],
      ['dot', 'boolean'],
      ['solid', 'boolean — 12% tint'],
    ],
  },
  {
    name: 'Alert',
    group: 'surfaces',
    className: 'nui-alert',
    description: 'Inline message with a 2px tone rule. `negative` is role="alert", the rest role="status". Risk disclosures must use `warning` with concrete wording.',
    Demo: () => (
      <Stack gap={3}>
        <Alert tone="info" title="Sync in progress.">
          Balances update once the wallet reaches the chain tip.
        </Alert>
        <Alert tone="positive" title="Payment sent.">
          1.2345 ZEC left the shielded pool in block 3,104,221.
        </Alert>
        <Alert tone="warning" title="Privacy changes on this route.">
          After bridging to NEAR the funds are public: addresses, amounts and history are visible to anyone and no longer protected by the Zcash shielded pool.
        </Alert>
        <Alert tone="negative" title="Could not reach the node." action={<Button size="sm" variant="outline">Retry</Button>}>
          The request timed out after 10 s.
        </Alert>
        <Alert tone="shielded" title="Shielded.">
          Sender, recipient and amount are encrypted on-chain.
        </Alert>
      </Stack>
    ),
    usage: `<Alert tone="warning" title="Privacy changes on this route.">
  After bridging to NEAR the funds are public.
</Alert>`,
    props: [
      ['tone', "'info' | 'positive' | 'negative' | 'warning' | 'shielded' = 'info'"],
      ['title', 'ReactNode'],
      ['children', 'ReactNode — body, text-secondary'],
      ['action', 'ReactNode — e.g. retry button'],
    ],
  },
  {
    name: 'DataTable',
    group: 'surfaces',
    className: 'nui-table-wrap',
    description:
      'Semantic table in a scrolling wrapper. Sortable headers set aria-sort; numeric columns are right-aligned tabular (`.is-num`); loading keeps the header with skeleton rows and aria-busy; empty renders an EmptyState instead of an empty table.',
    Demo: DataTableDemo,
    usage: `const columns: DataTableColumn<Tx>[] = [
  { key: 'height', header: 'Block', numeric: true, sortValue: (r) => r.height, cell: (r) => r.height },
  { key: 'amount', header: 'Amount', numeric: true, sortValue: (r) => r.amount,
    cell: (r) => (r.shielded ? 'Shielded' : formatAmount(r.amount) + ' ZEC') },
]

<DataTable columns={columns} rows={txs} rowKey="hash" loading={isLoading}
  defaultSort={{ key: 'height', direction: 'descending' }}
  empty={<EmptyState title="No transactions yet." />} />`,
    props: [
      ['columns', '{ key, header, cell(row, i), numeric?, sortValue?(row), width? }[]'],
      ['rows', 'readonly T[]'],
      ['rowKey', 'keyof T | (row, i) => Key'],
      ['loading', 'boolean — aria-busy, header kept, skeleton rows'],
      ['loadingRows', 'number = 5'],
      ['empty', 'ReactNode = <EmptyState title={m.noResults} />'],
      ['onRowClick', '(row, i) => void — enhancement only; keep a focusable link in the row'],
      ['defaultSort', "{ key, direction: 'ascending' | 'descending' }"],
      ['sort / onSortChange', 'controlled sort'],
      ['caption', 'ReactNode — visually hidden'],
      ['rowSelected / rowInvalid', '(row, i) => boolean — data-selected / data-invalid'],
    ],
  },
  {
    name: 'KeyValue',
    group: 'surfaces',
    className: 'nui-kv',
    description: 'Two-column definition list with soft row rules. Values right-aligned and tabular; `left` for long text and addresses.',
    Demo: () => (
      <Grid cols={2}>
        <KeyValue
          items={[
            ['Amount', '1.23450000 ZEC'],
            ['Network fee', '0.0001 ZEC'],
            ['Pool', 'Orchard'],
            ['Total', <strong key="t">1.23460000 ZEC</strong>],
          ]}
        />
        <KeyValue
          left
          items={[
            ['Recipient', <span key="a" className="nui-mono">{ADDR.unified.slice(0, 64)}…</span>],
            ['Memo', 'Invoice 2026-10 · thanks'],
            ['Sender', 'Hidden by shielded pool'],
          ]}
        />
      </Grid>
    ),
    usage: `<KeyValue items={[['Amount', '1.2345 ZEC'], ['Fee', '0.0001 ZEC']]} />
<KeyValue left items={[['Recipient', <Address value={addr} />]]} />`,
    props: [
      ['items', 'readonly [label: ReactNode, value: ReactNode][]'],
      ['children', '<dt>/<dd> pairs (instead of items)'],
      ['left', 'boolean — left-align values'],
    ],
  },
  {
    name: 'Stepper',
    group: 'surfaces',
    className: 'nui-stepper',
    description: 'Ordered steps with 28px round markers. data-state pending / active (accent ring, aria-current="step") / complete (accent fill, ✓) / error (negative, !).',
    Demo: () => (
      <Stack gap={8}>
        <Stepper
          horizontal
          steps={[
            { title: 'Deposit', description: 'ZEC received', state: 'complete' },
            { title: 'Confirm', description: '3 of 10 blocks', state: 'active' },
            { title: 'Mint nZEC', state: 'pending' },
            { title: 'Done', state: 'pending' },
          ]}
        />
        <Stepper
          steps={[
            { title: 'Connect wallet', description: 'Unified address detected.', state: 'complete' },
            { title: 'Sign transfer', description: 'Signature rejected by the wallet.', state: 'error' },
            { title: 'Broadcast', state: 'pending' },
          ]}
        />
      </Stack>
    ),
    usage: `<Stepper horizontal steps={[
  { title: 'Deposit', state: 'complete' },
  { title: 'Confirm', description: '3 of 10 blocks', state: 'active' },
  { title: 'Mint nZEC', state: 'pending' },
]} />`,
    props: [
      ['steps', "{ title, description?, state: 'pending' | 'active' | 'complete' | 'error' }[]"],
      ['horizontal', 'boolean — vertical again ≤640px'],
    ],
  },
  {
    name: 'Progress',
    group: 'surfaces',
    className: 'nui-progress',
    description: '4px accent bar, role="progressbar". Without `value` it is indeterminate (30% bar, 1.4s loop).',
    Demo: () => (
      <Stack gap={5}>
        {[0, 45, 100].map((v) => (
          <Stack key={v} gap={2}>
            <span className="nui-text-small nui-text-muted">{v}%</span>
            <Progress value={v} label={`Upload ${v}%`} />
          </Stack>
        ))}
        <Stack gap={2}>
          <span className="nui-text-small nui-text-muted">Indeterminate</span>
          <Progress label="Scanning blocks" />
        </Stack>
      </Stack>
    ),
    usage: `<Progress value={45} label="Upload" />
<Progress label="Scanning blocks" /> {/* indeterminate */}`,
    props: [
      ['value', 'number 0–100 — omit for indeterminate'],
      ['label', 'string — aria-label'],
    ],
  },
  {
    name: 'Skeleton',
    group: 'surfaces',
    className: 'nui-skeleton',
    description: 'Shimmering placeholder, always aria-hidden. Put aria-busy on the loading container.',
    Demo: () => (
      <div aria-busy="true">
        <Grid cols={3}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <div className="nui-card__head">
                <Skeleton width={42} height={42} />
                <Skeleton width="60%" height={24} />
              </div>
              <Skeleton lines={3} />
            </Card>
          ))}
        </Grid>
      </div>
    ),
    usage: `<Skeleton width="8em" />
<Skeleton lines={3} />`,
    props: [
      ['width', "CSSProperties['width'] = '100%'"],
      ['height', "CSSProperties['height'] = '1em'"],
      ['lines', 'number — stacked lines, last at 60%'],
    ],
  },
  {
    name: 'EmptyState',
    group: 'surfaces',
    className: 'nui-empty',
    description: 'Serif display-s title, one-line hint and a single action. Used for empty tables, lists and search results.',
    Demo: () => (
      <Panel flush>
        <EmptyState title="No positions yet." hint="Open a market and pick an outcome. Positions on public markets are visible to anyone." action={<Button variant="outline" arrow>Browse markets</Button>} />
      </Panel>
    ),
    usage: `<EmptyState title="No positions yet." hint="Pick a market to start." action={<Button>Browse markets</Button>} />`,
    props: [
      ['title', 'ReactNode'],
      ['hint', 'ReactNode'],
      ['action', 'ReactNode — one action'],
      ['titleAs', "ElementType = 'h3'"],
    ],
  },
]
