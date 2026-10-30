import { useState } from 'react'
import { Badge, CodeBlock, Disclosure, Grid, Identicon, InfoTip, NFTCard, Pagination, SecretField, Stack, Timeline, Tooltip, Cluster, Button } from '../../nui3'
import { ADDR, TXID } from '../sample'
import type { ComponentDoc } from '../types'

function PaginationDemo() {
  const [page, setPage] = useState(5)
  const [short, setShort] = useState(1)
  return (
    <Stack gap={5}>
      <Pagination page={page} pages={20} onChange={setPage} />
      <p className="nui-text-small nui-text-muted" aria-live="polite">
        Page {page} of 20
      </p>
      <Pagination page={short} pages={4} onChange={setShort} />
      <Pagination page={3} pages={9} onChange={() => {}} disabled />
    </Stack>
  )
}

const NFTS = [
  { name: 'Orchard Leaf #0412', collection: 'Shielded Garden', price: '12.5 ZEC', meta: 'Last 9.8 ZEC' },
  { name: 'Note Commitment #77', collection: 'Proof Studies', price: '3.2 ZEC', meta: 'Edition 7/50', badge: <Badge tone="accent">New</Badge> },
  { name: 'Viewing Key Study', collection: 'Proof Studies', price: '—', meta: 'Not listed' },
  { name: 'Sapling Root, long name that truncates on one line', collection: 'Shielded Garden', price: '0.85 ZEC', meta: 'Offer 0.7', badge: <Badge tone="warning" solid dot>Shielded</Badge> },
]

export const docs: ComponentDoc[] = [
  {
    name: 'CodeBlock',
    group: 'content',
    className: 'nui-code',
    description: 'Inverse surface (plum in paper, paper in night) with mono 13/1.65 code, optional tabs and an inline copy action that announces "Copied".',
    Demo: () => (
      <Stack gap={5}>
        <CodeBlock
          title="Install"
          snippets={[
            { label: 'npm', code: 'npm install @nui3/react @nui3/tokens', language: 'sh' },
            { label: 'pnpm', code: 'pnpm add @nui3/react @nui3/tokens', language: 'sh' },
            { label: 'yarn', code: 'yarn add @nui3/react @nui3/tokens', language: 'sh' },
          ]}
        />
        <CodeBlock
          title="App.tsx"
          language="tsx"
          code={`import '@nui3/react/css/nui3.css'
import { ThemeProvider, Button } from '@nui3/react'

export function App() {
  return (
    <ThemeProvider theme="auto">
      <Button variant="solid" arrow>Send shielded</Button>
    </ThemeProvider>
  )
}`}
        />
        <CodeBlock copyable={false} code={`curl https://rpc.example.org/v1/blocks/latest`} />
      </Stack>
    ),
    usage: `<CodeBlock title="Install" snippets={[{ label: 'npm', code: 'npm i @nui3/react' }, { label: 'pnpm', code: 'pnpm add @nui3/react' }]} />
<CodeBlock title="App.tsx" language="tsx" code={source} />`,
    props: [
      ['code', 'string'],
      ['snippets', '{ label, code, language? }[] — tabs (←/→ move)'],
      ['title', 'ReactNode'],
      ['language', 'string — shown in the head, data-language on <code>'],
      ['copyable', 'boolean = true'],
    ],
  },
  {
    name: 'SecretField',
    group: 'content',
    className: 'nui-secret',
    description: 'Masked secret (API key, viewing key) showing only the last 4 characters. The eye toggle uses aria-pressed and Reveal / Hide labels.',
    Demo: () => (
      <Stack gap={3}>
        <SecretField label="API key" value="nui_live_8f2c4a91d7e3b6058c1f" />
        <SecretField label="Viewing key" value={`zxviews1${TXID}${TXID.slice(0, 20)}`} defaultRevealed />
        <SecretField label="Webhook secret" value="whsec_0b7d9a" visibleTail={0} actions={<Button size="sm">Rotate</Button>} />
      </Stack>
    ),
    usage: `<SecretField label="API key" value={key} />`,
    props: [
      ['value', 'string'],
      ['visibleTail', 'number = 4'],
      ['label', 'string — sr-only name'],
      ['defaultRevealed', 'boolean'],
      ['actions', 'ReactNode — e.g. CopyButton'],
    ],
  },
  {
    name: 'Timeline',
    group: 'content',
    className: 'nui-timeline',
    description: 'Vertical event list with 20px ring dots coloured by data-tone (accent / positive / negative / info).',
    Demo: () => (
      <Timeline
        items={[
          { title: 'Deposit detected', time: '14:02', dateTime: '2026-10-30T14:02', description: '1.2345 ZEC into the bridge vault. Sample data.', tone: 'accent' },
          { title: '10 confirmations', time: '14:27', tone: 'positive', description: 'Finalised on Zcash.' },
          { title: 'Mint nZEC', time: '14:28', tone: 'info', description: 'Submitted to Noir. Balance is confidential once minted.' },
          { title: 'Relayer retry', time: '14:31', tone: 'negative', description: 'First submission timed out; retried automatically.' },
          { title: 'Completed', time: '14:33' },
        ]}
      />
    ),
    usage: `<Timeline items={[{ title: 'Deposit detected', time: '14:02', tone: 'accent' }, { title: 'Completed', time: '14:33', tone: 'positive' }]} />`,
    props: [
      ['items', "{ title, time?, dateTime?, description?, tone?: 'neutral' | 'accent' | 'positive' | 'negative' | 'info' }[]"],
    ],
  },
  {
    name: 'Pagination',
    group: 'content',
    className: 'nui-pagination',
    description: '34×34 page buttons with ellipsis gaps from paginationRange(page, pages, siblings). Current page has aria-current="page".',
    Demo: PaginationDemo,
    usage: `const [page, setPage] = useState(1)
<Pagination page={page} pages={20} onChange={setPage} />`,
    props: [
      ['page', 'number (1-based)'],
      ['pages', 'number'],
      ['onChange', '(page: number) => void'],
      ['siblings', 'number = 1'],
      ['label', 'string = m.page — nav aria-label'],
      ['disabled', 'boolean'],
    ],
  },
  {
    name: 'Tooltip',
    group: 'content',
    className: 'nui-tooltip',
    description: 'Inverse bubble on hover or focus-within, role="tooltip" wired via aria-describedby; Esc hides it.',
    Demo: () => (
      <Stack gap={8}>
        <Cluster gap={6}>
          <Tooltip content="Fee paid to miners. Fixed by ZIP-317.">
            <Button size="sm" variant="outline">
              Hover or focus me
            </Button>
          </Tooltip>
          <Tooltip side="bottom" content="Bubble below the trigger.">
            <Button size="sm" variant="outline">
              Bottom
            </Button>
          </Tooltip>
          <span className="nui-text-small">
            Health factor{' '}
            <InfoTip label="About health factor" content="Below 1.0 the position can be liquidated. Collateral price moves change it." />
          </span>
        </Cluster>
        <p className="nui-text-small nui-text-muted">Press Esc while the bubble is visible to hide it.</p>
      </Stack>
    ),
    usage: `<Tooltip content="Fee paid to miners."><Button>Fee</Button></Tooltip>
<InfoTip label="About health factor" content="Below 1.0 the position can be liquidated." />`,
    props: [
      ['content', 'ReactNode'],
      ['side', "'top' | 'bottom' = 'top'"],
      ['children', 'trigger element (gets aria-describedby)'],
    ],
  },
  {
    name: 'InfoTip',
    group: 'content',
    className: 'nui-infotip',
    description: '15px round "i" button (serif 9px) that opens a Tooltip; cursor help. The label is required and becomes the aria-label.',
    Demo: () => (
      <span className="nui-text-small">
        Health factor <InfoTip label="About health factor" content="Below 1.0 the position can be liquidated. Collateral price moves change it." />
      </span>
    ),
    usage: `<InfoTip label="About health factor" content="Below 1.0 the position can be liquidated." />`,
    props: [
      ['label', 'string — required aria-label'],
      ['content', 'ReactNode = label'],
    ],
  },
  {
    name: 'Disclosure',
    group: 'content',
    className: 'nui-disclosure',
    description: 'Native <details> with a +/− summary. Keyboard (Enter/Space) and open state come from the platform.',
    Demo: () => (
      <div>
        <Disclosure summary="What does shielded mean?" defaultOpen>
          <p>The transaction stays inside the Zcash shielded pool. Sender, recipient and amount are encrypted on-chain.</p>
        </Disclosure>
        <Disclosure summary="Is Noir confidential the same as shielded?">
          <p>No. Confidential execution hides balances and positions from the public, but they are processed by the execution environment and are not protected by Zcash shielded cryptography.</p>
        </Disclosure>
        <Disclosure summary="Advanced settings">
          <p>Custom fee, expiry height and change address.</p>
        </Disclosure>
      </div>
    ),
    usage: `<Disclosure summary="What does shielded mean?">…</Disclosure>`,
    props: [
      ['summary', 'ReactNode'],
      ['defaultOpen', 'boolean'],
      ['onToggle', 'native details toggle event'],
    ],
  },
  {
    name: 'Identicon',
    group: 'content',
    className: 'nui-identicon',
    description: 'Deterministic avatar from a hash of `value`: round 5×5 grid or square abstract art (NFT placeholder). Decorative unless `label` is set.',
    Demo: () => (
      <Stack gap={5}>
        <Cluster gap={3}>
          {[ADDR.unified, ADDR.sapling, ADDR.transparent, ADDR.tex, 'alice', 'bob'].map((v) => (
            <Identicon key={v} value={v} />
          ))}
          <Identicon value={ADDR.unified} size={48} label="Account avatar" />
        </Cluster>
        <Cluster gap={3}>
          {['Orchard Leaf #0412', 'Note Commitment #77', 'Viewing Key Study', 'Sapling Root'].map((v) => (
            <Identicon key={v} value={v} variant="art" size={72} />
          ))}
        </Cluster>
      </Stack>
    ),
    usage: `<Identicon value={address} />
<Identicon value={tokenId} variant="art" size={96} label="Placeholder art" />`,
    props: [
      ['value', 'string'],
      ['size', "number | string = 32 ('100%' fills the parent)"],
      ['variant', "'grid' | 'art' = 'grid'"],
      ['label', 'string — role="img" + aria-label; otherwise aria-hidden'],
    ],
  },
  {
    name: 'NFTCard',
    group: 'content',
    className: 'nui-nft',
    description: 'Square media, collection label, single-line name, price and meta. Without an image an Identicon art placeholder is generated. `href` makes the card clickable through one stretched link.',
    Demo: () => (
      <Grid cols={4}>
        {NFTS.map((n, i) => (
          <NFTCard key={n.name} {...n} href={i < 3 ? `#nft-${i}` : undefined} />
        ))}
      </Grid>
    ),
    usage: `<NFTCard name="Orchard Leaf #0412" collection="Shielded Garden" price="12.5 ZEC" meta="Last 9.8 ZEC" href="/nft/412" />`,
    props: [
      ['name', 'string'],
      ['collection', 'ReactNode'],
      ['image', 'string — URL; otherwise Identicon art'],
      ['imageAlt', "string = ''"],
      ['seed', 'string = name — placeholder seed'],
      ['badge', 'ReactNode — top-left overlay'],
      ['price', 'ReactNode'],
      ['meta', 'ReactNode'],
      ['href', 'string'],
    ],
  },
]
