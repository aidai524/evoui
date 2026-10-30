import { useState, type FormEvent } from 'react'
import {
  Button,
  ChevronIcon,
  CloseIcon,
  CopyIcon,
  Dialog,
  Drawer,
  Eyebrow,
  ExternalIcon,
  EyeIcon,
  Field,
  GlobeIcon,
  Grid,
  IconButton,
  LockIcon,
  Menu,
  MenuIcon,
  NativeSelect,
  Select,
  ShieldIcon,
  Stack,
  SwapIcon,
  TokenIcon,
  formatAmount,
  type SelectOptionItem,
} from '../../nui3'
import { TOKENS } from '../sample'
import type { ComponentDoc } from '../types'

/* ───────────────────────── sample data ───────────────────────── */

interface TokenOption extends SelectOptionItem {
  name: string
  balance: bigint
  decimals: number
}

const TOKEN_OPTIONS: TokenOption[] = TOKENS.map((t) => ({
  value: t.symbol,
  label: t.symbol,
  textValue: `${t.symbol} ${t.name}`,
  name: t.name,
  balance: t.balance,
  decimals: t.decimals,
  disabled: t.balance === 0n,
}))

const COUNTRIES: SelectOptionItem[] = [
  ['AR', 'Argentina'],
  ['AU', 'Australia'],
  ['AT', 'Austria'],
  ['BE', 'Belgium'],
  ['BR', 'Brazil'],
  ['CA', 'Canada'],
  ['CL', 'Chile'],
  ['CN', 'China'],
  ['CO', 'Colombia'],
  ['CZ', 'Czechia'],
  ['DK', 'Denmark'],
  ['FI', 'Finland'],
  ['FR', 'France'],
  ['DE', 'Germany'],
  ['GR', 'Greece'],
  ['HK', 'Hong Kong'],
  ['IN', 'India'],
  ['ID', 'Indonesia'],
  ['IE', 'Ireland'],
  ['IT', 'Italy'],
  ['JP', 'Japan'],
  ['KR', 'Korea'],
  ['MX', 'Mexico'],
  ['NL', 'Netherlands'],
  ['NZ', 'New Zealand'],
  ['NO', 'Norway'],
  ['PL', 'Poland'],
  ['PT', 'Portugal'],
  ['SG', 'Singapore'],
  ['ES', 'Spain'],
  ['SE', 'Sweden'],
  ['CH', 'Switzerland'],
  ['TW', 'Taiwan'],
  ['TR', 'Türkiye'],
  ['AE', 'United Arab Emirates'],
  ['GB', 'United Kingdom'],
  ['US', 'United States'],
].map(([code, name]) => ({ value: code, label: name, description: code, disabled: code === 'US' }))

const NETWORKS: SelectOptionItem[] = [
  { value: 'zec-main', label: 'Mainnet', description: 'Orchard + Sapling pools', group: 'Zcash', icon: <ShieldIcon /> },
  { value: 'zec-test', label: 'Testnet', description: 'Faucet funds only', group: 'Zcash', icon: <ShieldIcon /> },
  { value: 'near', label: 'NEAR', description: 'Confidential execution', group: 'Bridges', icon: <LockIcon /> },
  { value: 'eth', label: 'Ethereum', description: 'Public chain', group: 'Bridges', icon: <GlobeIcon /> },
  { value: 'sol', label: 'Solana', description: 'Coming soon', group: 'Bridges', icon: <GlobeIcon />, disabled: true },
]

const ALERTS = ['Incoming payments', 'Outgoing payments', 'Price alerts', 'Governance votes', 'Security notices']

/* ───────────────────────── demos ───────────────────────── */

function TokenRow({ o }: { o: TokenOption }) {
  return (
    <>
      <TokenIcon symbol={o.value} size="sm" />
      <span style={{ display: 'grid', flex: '1 1 auto', minWidth: 0, lineHeight: 1.3 }}>
        <span style={{ fontWeight: 600 }}>{o.value}</span>
        <span className="nui-text-muted" style={{ fontSize: 'var(--nui-fs-label)', fontWeight: 400 }}>
          {o.name}
        </span>
      </span>
      <span className="nui-text-secondary" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 400 }}>
        {formatAmount(o.balance, { decimals: o.decimals })}
      </span>
    </>
  )
}

function TokenSelect(props: { value: string; onChange: (v: string) => void }) {
  return (
    <Select<TokenOption>
      options={TOKEN_OPTIONS}
      value={props.value}
      onChange={(v) => props.onChange(v)}
      searchable
      searchPlaceholder="Search name or symbol"
      renderOption={(o) => <TokenRow o={o} />}
      renderValue={(o) => (
        <>
          <TokenIcon symbol={o.value} size="sm" />
          <span>{o.value}</span>
          <span className="nui-text-muted" style={{ fontSize: 'var(--nui-fs-small)' }}>
            {formatAmount(o.balance, { decimals: o.decimals })}
          </span>
        </>
      )}
    />
  )
}

function SelectDemo() {
  const [network, setNetwork] = useState('Mainnet')
  const [token, setToken] = useState('ZEC')
  const [alerts, setAlerts] = useState<string[]>(['Incoming payments'])
  const [posted, setPosted] = useState('')

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setPosted(JSON.stringify({ country: fd.get('country'), alerts: fd.getAll('alerts') }))
  }

  return (
    <Stack gap={8}>
      <Stack gap={4}>
        <Eyebrow>Basics</Eyebrow>
        <Grid cols={2}>
          <Field label="Network" hint={`Selected: ${network}`}>
            <Select options={['Mainnet', 'Testnet', 'Regtest']} value={network} onChange={(v) => setNetwork(v)} data-testid="select-simple" />
          </Field>
          <Field label="Pay with" labelAside="Rows via renderOption">
            <TokenSelect value={token} onChange={setToken} />
          </Field>
        </Grid>
      </Stack>

      <form onSubmit={submit}>
        <Stack gap={4}>
          <Eyebrow>Search, multiple, forms</Eyebrow>
          <Grid cols={2}>
            <Field label="Country" hint="Type to filter; United States is unavailable.">
              <Select name="country" options={COUNTRIES} searchable clearable placeholder="Choose a country" data-testid="select-country" />
            </Field>
            <Field label="Notify me about">
              <Select multiple clearable name="alerts" options={ALERTS} value={alerts} onChange={(v) => setAlerts(v)} maxChips={2} data-testid="select-multi" />
            </Field>
          </Grid>
          <Stack gap={3}>
            <div>
              <Button variant="outline" type="submit">
                Submit form
              </Button>
            </div>
            {posted && (
              <code className="nui-mono nui-text-muted" style={{ fontSize: 'var(--nui-fs-label)', overflowWrap: 'anywhere' }} data-testid="posted">
                FormData → {posted}
              </code>
            )}
          </Stack>
        </Stack>
      </form>

      <Stack gap={4}>
        <Eyebrow>Groups, descriptions, states</Eyebrow>
        <Grid cols={3}>
          <Field label="Destination">
            <Select options={NETWORKS} defaultValue="zec-main" data-testid="select-grouped" />
          </Field>
          <Field label="Destination" error="Pick a destination network">
            <Select options={NETWORKS} placeholder="Choose…" />
          </Field>
          <Field label="Destination" disabled>
            <Select options={NETWORKS} defaultValue="near" />
          </Field>
        </Grid>
      </Stack>

      <Stack gap={4}>
        <Eyebrow>Inside overflow: hidden, a Dialog and a Drawer</Eyebrow>
        <ClippedAndModal />
      </Stack>
    </Stack>
  )
}

function ClippedAndModal() {
  const [dialog, setDialog] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [token, setToken] = useState('USDC')
  return (
    <Grid cols={2}>
      <div data-testid="clip-box" style={{ height: 104, overflow: 'hidden', padding: 'var(--nui-space-3)', border: '1px dashed var(--nui-border-strong)' }}>
        <Field label="Clipped parent">
          <Select options={COUNTRIES.slice(0, 14)} defaultValue="FR" data-testid="select-clipped" />
        </Field>
      </div>
      <Stack gap={3} style={{ alignContent: 'start' }}>
        <div>
          <Button variant="outline" onClick={() => setDialog(true)} data-testid="open-dialog">
            Open dialog
          </Button>{' '}
          <Button variant="subtle" onClick={() => setDrawer(true)} data-testid="open-drawer">
            Open drawer
          </Button>
        </div>
        <p className="nui-text-small nui-text-muted" style={{ margin: 0 }}>
          The panel mounts inside the open &lt;dialog&gt;, so it paints above the browser top layer. Esc closes the panel first, then the dialog.
        </p>
      </Stack>
      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Send"
        footer={
          <Button variant="solid" onClick={() => setDialog(false)}>
            Continue
          </Button>
        }
      >
        <Stack gap={5}>
          <Field label="Asset">
            <TokenSelect value={token} onChange={setToken} />
          </Field>
          <Field label="Network">
            <Select options={NETWORKS} defaultValue="zec-main" data-testid="dialog-select" />
          </Field>
        </Stack>
      </Dialog>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters">
        <Stack gap={5}>
          <Field label="Country">
            <Select options={COUNTRIES} searchable placeholder="Any country" data-testid="drawer-select" />
          </Field>
          <Field label="Alerts">
            <Select multiple options={ALERTS} placeholder="None" />
          </Field>
        </Stack>
      </Drawer>
    </Grid>
  )
}

function MenuDemo() {
  const [last, setLast] = useState('—')
  const act = (what: string) => () => setLast(what)
  return (
    <Stack gap={5}>
      <Grid cols={2}>
        <div>
          <Menu
            trigger={
              <Button variant="outline" data-testid="menu-trigger">
                Wallet actions <ChevronIcon />
              </Button>
            }
            items={[
              { type: 'label', label: 'Orchard wallet' },
              { label: 'Copy address', icon: <CopyIcon />, shortcut: '⌘C', onSelect: act('Copy address') },
              { label: 'View on explorer', icon: <ExternalIcon />, onSelect: act('View on explorer') },
              { label: 'Reveal viewing key', icon: <EyeIcon />, shortcut: '⌘R', onSelect: act('Reveal viewing key') },
              { label: 'Shield funds', icon: <ShieldIcon />, disabled: true, onSelect: act('Shield funds') },
              { label: 'Swap', icon: <SwapIcon />, shortcut: '⌘S', onSelect: act('Swap') },
              { type: 'separator' },
              { label: 'Remove wallet', icon: <CloseIcon />, tone: 'negative', onSelect: act('Remove wallet') },
            ]}
          />
        </div>
        <div style={{ justifySelf: 'end' }}>
          <Menu
            placement="bottom-end"
            trigger={
              <IconButton label="More options">
                <MenuIcon />
              </IconButton>
            }
            items={[
              { label: 'Rename', onSelect: act('Rename') },
              { label: 'Duplicate', onSelect: act('Duplicate') },
              { label: 'Archive', onSelect: act('Archive') },
              { type: 'separator' },
              { label: 'Delete', tone: 'negative', onSelect: act('Delete') },
            ]}
          />
        </div>
      </Grid>
      <p className="nui-text-small nui-text-muted" style={{ margin: 0 }} aria-live="polite" data-testid="menu-last">
        Last action: {last}
      </p>
    </Stack>
  )
}

function NativeSelectDemo() {
  return (
    <Grid cols={3}>
      <Field label="Network">
        <NativeSelect options={['Mainnet', 'Testnet']} />
      </Field>
      <Field label="Currency" error="Pick a currency">
        <NativeSelect defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          <option>USD</option>
          <option>EUR</option>
        </NativeSelect>
      </Field>
      <Field label="Disabled">
        <NativeSelect options={['Orchard']} disabled />
      </Field>
    </Grid>
  )
}

/* ───────────────────────── entries ───────────────────────── */

export const docs: ComponentDoc[] = [
  {
    name: 'Select',
    group: 'forms',
    className: 'nui-selectbox',
    description:
      'Custom listbox select with the Input footprint. Rows can be anything (renderOption: token icon + name + balance), with optional search, groups, multiple selection and clearing. Select-only combobox pattern: ↑/↓/Home/End/PageUp/PageDown, Enter/Space, Esc, Tab, type-ahead. The panel is portaled, so overflow never clips it, and it mounts inside an open Dialog / Drawer.',
    Demo: SelectDemo,
    usage: `<Field label="Network">
  <Select options={['Mainnet', 'Testnet']} value={net} onChange={(value, option) => setNet(value)} />
</Field>

// Rich rows: extra option fields reach renderOption / renderValue
<Select<TokenOption>
  options={tokens.map((t) => ({ value: t.symbol, textValue: t.name, balance: t.balance, decimals: t.decimals }))}
  searchable
  renderOption={(o, { selected, active }) => <><TokenIcon symbol={o.value} /> {o.value} <span>{formatAmount(o.balance, o)}</span></>}
  renderValue={(o) => <><TokenIcon symbol={o.value} size="sm" /> {o.value}</>}
/>

// Multiple + form post (hidden inputs)
<Select multiple clearable name="alerts" options={['Incoming', 'Outgoing']} value={alerts} onChange={(values, options) => setAlerts(values)} />`,
    props: [
      ['options', 'Array<string | { value, label?, description?, icon?, disabled?, group?, textValue?, …extra }>'],
      ['value / defaultValue', "string ('' = none); string[] with multiple"],
      ['onChange', '(value, option) => void; (values, options) => void with multiple'],
      ['renderOption', '(option, { selected, active, disabled }) => ReactNode — row content'],
      ['renderValue', '(option) => ReactNode — trigger content (and chips)'],
      ['placeholder', "ReactNode = 'Select…'"],
      ['searchable / searchPlaceholder / filter / emptyText', 'filter field on top of the panel, custom match, empty state'],
      ['multiple / maxChips', 'boolean / number = 3 (more shows "n selected")'],
      ['clearable', 'boolean — clear button; Backspace / Delete clear too'],
      ['name', 'string — hidden input(s) for <form> posts'],
      ['invalid / disabled', 'boolean (also from Field)'],
      ['placement / onOpenChange / panelClassName', "Placement = 'bottom-start' / (open) => void / string"],
      ['…rest', 'button attributes on the combobox trigger (id, aria-*, data-*)'],
    ],
  },
  {
    name: 'NativeSelect',
    group: 'forms',
    className: 'nui-select',
    description:
      'The platform <select> with the two-line chevron (the only allowed gradient use). Zero JS and the OS picker on phones — use it for long plain-text lists in dense forms; use Select when rows need icons, descriptions, search or multiple values.',
    Demo: NativeSelectDemo,
    usage: `<Field label="Network"><NativeSelect options={[{ value: 'main', label: 'Mainnet' }, 'Testnet']} /></Field>`,
    props: [
      ['options', 'Array<string | { value, label?, disabled? }> (or <option> children)'],
      ['invalid', 'boolean'],
      ['…rest', 'native select attributes (value, onChange(event)…)'],
    ],
  },
  {
    name: 'Menu',
    group: 'actions',
    className: 'nui-menu',
    description:
      'Dropdown action menu on the shared floating layer: role=menu with roving focus (↑/↓ wrap, Home/End, type-ahead), Enter/Space run the item and close, Esc closes and returns focus to the trigger. Items take an icon, a shortcut hint and tone="negative" for destructive actions.',
    Demo: MenuDemo,
    usage: `<Menu
  trigger={<Button variant="outline">Wallet actions <ChevronIcon /></Button>}
  items={[
    { type: 'label', label: 'Orchard wallet' },
    { label: 'Copy address', icon: <CopyIcon />, shortcut: '⌘C', onSelect: copy },
    { label: 'Shield funds', disabled: true },
    { type: 'separator' },
    { label: 'Remove wallet', tone: 'negative', onSelect: remove },
  ]}
/>`,
    props: [
      ['trigger', 'ReactElement — gets ref, aria-haspopup, aria-expanded and handlers'],
      ['items', "Array<{ label, icon?, shortcut?, onSelect?, disabled?, tone?: 'negative', textValue? } | { type: 'separator' } | { type: 'label', label }>"],
      ['placement', "Placement = 'bottom-start'"],
      ['label', 'string — menu name (defaults to the trigger text)'],
      ['onOpenChange / className', '(open) => void / string (panel)'],
    ],
  },
]
