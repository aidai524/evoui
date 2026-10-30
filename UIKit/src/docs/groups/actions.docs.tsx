import { useState } from 'react'
import { Button, ChipGroup, Cluster, CopyIcon, Eyebrow, ExternalIcon, IconButton, Segmented, Stack, SwapIcon, TabPanel, Tabs } from '../../nui3'
import type { ComponentDoc } from '../types'

function ButtonDemo() {
  const [busy, setBusy] = useState(false)
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Eyebrow>Variants</Eyebrow>
        <Cluster gap={5}>
          <Button
            variant="solid"
            arrow
            loading={busy}
            onClick={() => {
              setBusy(true)
              setTimeout(() => setBusy(false), 1600)
            }}
          >
            Sign &amp; send
          </Button>
          <Button>Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="danger">Revoke</Button>
          <Button variant="underline" arrow>
            Read guide
          </Button>
        </Cluster>
      </Stack>
      <Stack gap={2}>
        <Eyebrow>Sizes</Eyebrow>
        <Cluster gap={5}>
          <Button variant="outline" size="sm">
            Small
          </Button>
          <Button variant="outline">Medium</Button>
          <Button variant="outline" size="lg">
            Large
          </Button>
        </Cluster>
      </Stack>
      <Stack gap={2}>
        <Eyebrow>States</Eyebrow>
        <Cluster gap={5}>
          <Button variant="outline" loading>
            Submitting
          </Button>
          <Button variant="outline" disabled>
            Disabled
          </Button>
          <Button variant="subtle" href="https://z.cash/" arrow>
            External link
          </Button>
        </Cluster>
      </Stack>
      <div style={{ background: 'var(--nui-color-plum)', padding: 'var(--nui-space-5) var(--nui-space-6)' }}>
        <Button variant="invert" arrow>
          Invert (dark sections)
        </Button>
      </div>
      <div style={{ maxWidth: 360 }}>
        <Button variant="subtle" block>
          Block subtle
        </Button>
      </div>
    </Stack>
  )
}

function IconButtonDemo() {
  const [shown, setShown] = useState(false)
  return (
    <Cluster gap={4}>
      <IconButton label="Copy address">
        <CopyIcon />
      </IconButton>
      <IconButton label="Switch tokens" aria-pressed={shown} onClick={() => setShown(!shown)}>
        <SwapIcon />
      </IconButton>
      <IconButton label="Open explorer" size="sm">
        <ExternalIcon />
      </IconButton>
      <IconButton label="Copy (disabled)" disabled>
        <CopyIcon />
      </IconButton>
    </Cluster>
  )
}

function ChipGroupDemo() {
  const [v, setV] = useState('all')
  return (
    <Stack gap={3}>
      <ChipGroup
        label="Filter apps"
        value={v}
        onChange={setV}
        options={[
          { value: 'all', label: 'All', count: 12 },
          { value: 'wallet', label: 'Wallets', count: 3 },
          { value: 'defi', label: 'DeFi', count: 5 },
          { value: 'markets', label: 'Markets', count: 2 },
          { value: 'infra', label: 'Infrastructure', count: 2 },
          { value: 'soon', label: 'Coming soon', disabled: true },
        ]}
      />
      <p className="nui-text-small nui-text-muted">
        Selected: <code className="nui-mono">{v}</code> · Tab in, then ←/→.
      </p>
    </Stack>
  )
}

function TabsDemo() {
  const [v, setV] = useState('positions')
  return (
    <Tabs
      label="Account"
      value={v}
      onChange={setV}
      items={[
        { value: 'positions', label: 'Positions' },
        { value: 'orders', label: 'Open orders' },
        { value: 'history', label: 'History' },
        { value: 'funding', label: 'Funding', disabled: true },
      ]}
    >
      <TabPanel value="positions">
        <p className="nui-text-secondary">2 open positions on the sample market.</p>
      </TabPanel>
      <TabPanel value="orders">
        <p className="nui-text-secondary">No open orders.</p>
      </TabPanel>
      <TabPanel value="history">
        <p className="nui-text-secondary">Last 30 days of fills.</p>
      </TabPanel>
      <TabPanel value="funding">
        <p className="nui-text-secondary">Funding payments.</p>
      </TabPanel>
    </Tabs>
  )
}

function SegmentedDemo() {
  const [side, setSide] = useState('long')
  const [type, setType] = useState('market')
  const [slip, setSlip] = useState('0.5')
  return (
    <Stack gap={5}>
      <div style={{ maxWidth: 360 }}>
        <Segmented
          block
          label="Side"
          value={side}
          onChange={setSide}
          options={[
            { value: 'long', label: 'Long' },
            { value: 'short', label: 'Short' },
          ]}
        />
      </div>
      <Segmented
        label="Order type"
        value={type}
        onChange={setType}
        options={[
          { value: 'market', label: 'Market' },
          { value: 'limit', label: 'Limit' },
          { value: 'stop', label: 'Stop', disabled: true },
        ]}
      />
      <Segmented label="Slippage" value={slip} onChange={setSlip} options={['0.1', '0.5', '1.0']} />
      <Segmented label="Theme (disabled)" value="paper" onChange={() => {}} options={['paper', 'night']} disabled />
    </Stack>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'Button',
    group: 'actions',
    className: 'nui-btn',
    description:
      'All actions. Default ghost (no fill, uppercase, 0.2em tracking); solid is the single primary action of a view (R2). href renders a link; external links open in a new tab.',
    Demo: ButtonDemo,
    usage: `import { Button } from '@nui3/react'

<Button variant="solid" arrow loading={sending} onClick={send}>Sign & send</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="underline" href="/docs" arrow>Read guide</Button>`,
    props: [
      ['variant', "'ghost' | 'solid' | 'outline' | 'subtle' | 'danger' | 'invert' | 'underline' = 'ghost'"],
      ['size', "'sm' | 'md' | 'lg' = 'md'"],
      ['block', 'boolean — full width'],
      ['arrow', 'boolean — trailing arrow, moves 6px on hover'],
      ['loading', 'boolean — aria-busy + spinner, disables the button'],
      ['href', 'string — renders <a>; http(s) gets target=_blank rel=noopener noreferrer'],
      ['…rest', 'ButtonHTMLAttributes (type defaults to "button")'],
    ],
  },
  {
    name: 'IconButton',
    group: 'actions',
    className: 'nui-icon-btn',
    description: 'Icon-only button, 32×32 (sm 24×24). label is required and becomes aria-label and title.',
    Demo: IconButtonDemo,
    usage: `<IconButton label={m.copyAddress} onClick={copy}><CopyIcon /></IconButton>`,
    props: [
      ['label', 'string (required) — aria-label + title'],
      ['size', "'sm' | 'md' = 'md'"],
      ['children', 'icon node'],
    ],
  },
  {
    name: 'ChipGroup',
    group: 'actions',
    className: 'nui-chips',
    description: 'Single-select filter chips: role=group, aria-pressed, roving tabindex, ←/→ move and select. Scrolls horizontally on narrow screens.',
    Demo: ChipGroupDemo,
    usage: `<ChipGroup label="Filter apps" value={cat} onChange={setCat}
  options={[{ value: 'all', label: 'All', count: 12 }, { value: 'defi', label: 'DeFi', count: 5 }]} />`,
    props: [
      ['options', "Array<string | { value, label?, count?, disabled? }>"],
      ['value', 'string | undefined'],
      ['onChange', '(value) => void'],
      ['label', 'string — group aria-label'],
    ],
  },
  {
    name: 'Tabs',
    group: 'actions',
    className: 'nui-tabs',
    description: 'role=tablist/tab with aria-controls and roving tabindex; ←/→ move and select. TabPanel children pick up the wiring from context.',
    Demo: TabsDemo,
    usage: `<Tabs label="Account" value={tab} onChange={setTab}
  items={[{ value: 'positions', label: 'Positions' }, { value: 'orders', label: 'Open orders' }]}>
  <TabPanel value="positions">…</TabPanel>
  <TabPanel value="orders">…</TabPanel>
</Tabs>`,
    props: [
      ['items', 'Array<{ value, label, disabled? } | string>'],
      ['value', 'string | undefined'],
      ['onChange', '(value) => void'],
      ['label', 'string — tablist aria-label'],
      ['id', 'string — base id; panels are {id}-panel-{value}'],
      ['children', 'TabPanel elements (optional)'],
    ],
  },
  {
    name: 'TabPanel',
    group: 'actions',
    className: 'nui-tab-panel',
    description: 'role=tabpanel with id {tabsId}-panel-{value} and aria-labelledby. Inactive panels are hidden but keep tabIndex=0.',
    Demo: TabsDemo,
    usage: `// Inside <Tabs>: context wiring
<TabPanel value="orders">…</TabPanel>

// Elsewhere: pass the Tabs id and the active flag
<Tabs id="acct" … />
<TabPanel tabsId="acct" value="orders" selected={tab === 'orders'}>…</TabPanel>`,
    props: [
      ['value', 'string'],
      ['tabsId', 'string — only outside <Tabs>'],
      ['selected', 'boolean — only outside <Tabs>'],
    ],
  },
  {
    name: 'Segmented',
    group: 'actions',
    className: 'nui-segmented',
    description: 'Mutually exclusive choice (Long/Short, Market/Limit, slippage, theme): role=radiogroup + radio/aria-checked, ←/→ move and select. Use it instead of two solid buttons.',
    Demo: SegmentedDemo,
    usage: `<Segmented label="Side" value={side} onChange={setSide}
  options={[{ value: 'long', label: m.long }, { value: 'short', label: m.short }]} block />`,
    props: [
      ['options', "Array<string | { value, label?, disabled? }>"],
      ['value', 'string | undefined'],
      ['onChange', '(value) => void'],
      ['label', 'string — radiogroup aria-label'],
      ['block', 'boolean — full width, equal items'],
      ['disabled', 'boolean'],
    ],
  },
]
