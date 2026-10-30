import { useState } from 'react'
import {
  Brand,
  Breadcrumb,
  Button,
  Cluster,
  Footer,
  Header,
  Segmented,
  Stack,
  SubNav,
  ZcashMark,
  type NavItem,
  type RenderLink,
} from '../../nui3'
import type { ComponentDoc } from '../types'

/** Demo router adapter: keeps the workbench hash route, tracks the "current" href in state. */
function useDemoRouter(initial: string) {
  const [path, setPath] = useState(initial)
  const renderLink: RenderLink = ({ href, onClick, children, ...p }) => (
    <a
      {...(p as object)}
      href={href}
      onClick={(e) => {
        if (/^https?:/.test(href)) return
        e.preventDefault()
        setPath(href)
        onClick?.(e)
      }}
    >
      {children}
    </a>
  )
  return { path, renderLink }
}

const APPS: [string, string, string][] = [
  ['/apps/wallet', 'Wallet', 'Phase 1 · Shielded send and receive'],
  ['/apps/bridge', 'Bridge', 'Phase 1 · Zcash ⇄ NEAR routes'],
  ['/apps/swap', 'Swap', 'Phase 2 · Confidential swaps'],
  ['/apps/lending', 'Lending', 'Phase 2 · Borrow against nZEC'],
  ['/apps/perps', 'Perps', 'Phase 3 · Confidential perpetuals'],
  ['/apps/explorer', 'Explorer', 'Phase 1 · Public chain data'],
]

function HeaderDemo() {
  const { path, renderLink } = useDemoRouter('/apps/bridge')
  const [lang, setLang] = useState('en')
  const nav: NavItem[] = [
    { label: 'Overview', href: '/' },
    { label: 'Apps', children: APPS.map(([href, label, description]) => ({ href, label, description, current: path === href })) },
    {
      label: 'Build',
      children: [
        { href: '/build', label: 'Build overview', description: 'Start here' },
        { href: '/build/start', label: 'Getting started', description: 'Install and configure' },
        { href: '/build/docs', label: 'Component docs', description: '99 components' },
        { href: '/build/ai', label: 'AI integration', description: 'Context for coding agents' },
      ].map((c) => ({ ...c, current: path === c.href })),
    },
    { label: 'Ecosystem', href: '/ecosystem' },
  ].map((it) => ('href' in it && it.href ? { ...it, current: path === it.href } : it))
  const langSwitch = (
    <Segmented
      label="Language"
      value={lang}
      onChange={setLang}
      options={[
        { value: 'en', label: 'EN' },
        { value: 'zh', label: '中文' },
      ]}
    />
  )
  return (
    <Stack gap={4}>
      <div style={{ border: '1px solid var(--nui-border)' }}>
        <Header
          bordered
          brand={{ name: 'Noir', sub: 'NUI3', href: '/' }}
          nav={nav}
          renderLink={renderLink}
          actions={
            <Button variant="outline" size="sm" href="https://github.com/">
              GitHub
            </Button>
          }
          mobileActions={
            <Stack gap={3}>
              {langSwitch}
              <Button variant="outline" size="sm" href="https://github.com/">
                GitHub
              </Button>
            </Stack>
          }
        />
        <div style={{ height: 240, padding: 'var(--nui-space-6)', background: 'var(--nui-bg-alt)' }}>
          <p className="nui-text-small nui-text-muted">
            Current route: <code className="nui-mono">{path}</code>. Hover or click Apps / Build; Esc or an outside click closes. Below 1100px the nav collapses into the menu
            button and a Drawer.
          </p>
        </div>
      </div>
    </Stack>
  )
}

function SubNavDemo() {
  const { path, renderLink } = useDemoRouter('/lend/markets')
  const items = [
    { href: '/lend/markets', label: 'Markets' },
    { href: '/lend/supply', label: 'Supply' },
    { href: '/lend/borrow', label: 'Borrow' },
    { href: '/lend/positions', label: 'Positions', badge: 2 },
    { href: '/lend/history', label: 'History' },
    { href: '/lend/liquidations', label: 'Liquidations', badge: 0 },
  ].map((it) => ({ ...it, current: it.href === path }))
  return <SubNav label="Lending" items={items} renderLink={renderLink} />
}

const FOOTER_COLS = [
  {
    title: 'Discover',
    links: [
      { label: 'Overview', href: '#/c/footer' },
      { label: 'Public Infrastructure', href: '#/c/footer' },
      { label: 'Apps & Phases', href: '#/c/footer' },
      { label: 'Ecosystem', href: '#/c/footer' },
    ],
  },
  {
    title: 'Develop',
    links: [
      { label: 'Build', href: '#/c/footer' },
      { label: 'Extend', href: '#/c/footer' },
      { label: 'Documentation', href: '#/c/footer' },
      { label: 'AI Integration', href: '#/c/footer' },
    ],
  },
  {
    title: 'Participate',
    links: [
      { label: 'Contribute', href: '#/c/footer' },
      { label: 'GitHub', href: 'https://github.com/' },
      { label: 'Issues & RFCs', href: '#/c/footer' },
      { label: 'Roadmap', href: '#/c/footer' },
    ],
  },
]

export const docs: ComponentDoc[] = [
  {
    name: 'ZcashMark',
    group: 'navigation',
    className: 'nui-zcash-mark',
    description:
      'The Zcash mark: never recoloured (only color / mono variants), links to https://z.cash/ by default, role=img when titled. The current drawing is a placeholder for the official asset.',
    Demo: () => (
      <Cluster gap={6}>
        <ZcashMark title="Zcash" />
        <ZcashMark size={64} title="Zcash" />
        <ZcashMark variant="mono" title="Zcash" />
        <span style={{ color: 'var(--nui-text-muted)' }}>
          <ZcashMark variant="mono" size={24} href={null} />
        </span>
        <span className="nui-text-small nui-text-muted">Works with Zcash</span>
      </Cluster>
    ),
    usage: `<ZcashMark title="Zcash" />            // links to https://z.cash/
<ZcashMark variant="mono" size={24} href={null} />`,
    props: [
      ['size', 'number = 40'],
      ['variant', "'color' | 'mono' = 'color'"],
      ['title', 'string — role=img + accessible name; omitted → aria-hidden'],
      ['href', "string | null = 'https://z.cash/' — null renders the bare mark"],
    ],
  },
  {
    name: 'Brand',
    group: 'navigation',
    className: 'nui-brand',
    description: 'Product lockup: 40px mark + 18px name + optional uppercase sub-label (hidden ≤480px). The product name must not contain "Zcash" and outranks the mark.',
    Demo: () => (
      <Stack gap={5}>
        <Brand name="Noir" sub="NUI3" />
        <Brand name="Shieldpay" sub="Payroll" href="#/c/brand" />
        <Brand name="Ledgerline" />
      </Stack>
    ),
    usage: `<Brand name="Noir" sub="NUI3" href="/" />`,
    props: [
      ['name', 'ReactNode (required) — never contains "Zcash"'],
      ['sub', 'ReactNode'],
      ['href', 'string — renders a link'],
      ['mark', 'ReactNode — defaults to the unlinked ZcashMark'],
      ['renderLink', 'RenderLink'],
    ],
  },
  {
    name: 'Header',
    group: 'navigation',
    className: 'nui-header',
    description:
      'Site header: brand, primary nav with dropdown groups (hover bridge, aria-expanded/controls, Esc and outside click close), actions. Collapses at 1100px into a menu button that opens a Drawer.',
    Demo: HeaderDemo,
    usage: `<Header sticky bordered
  brand={{ name: 'Noir', sub: 'NUI3', href: '/' }}
  nav={[
    { label: 'Overview', href: '/', current: true },
    { label: 'Apps', children: [{ label: 'Bridge', href: '/apps/bridge', description: 'Phase 1 · Zcash ⇄ NEAR' }] },
  ]}
  actions={<Button variant="outline" size="sm" href="https://github.com/…">GitHub</Button>}
  renderLink={(p) => <RouterLink to={p.href} {...p} />}
/>`,
    props: [
      ['brand', 'BrandProps | ReactNode'],
      ['nav', 'NavItem[] — { label, href?, current?, description?, children? }'],
      ['actions', 'ReactNode — hidden ≤640px'],
      ['mobileActions', 'ReactNode — drawer actions (defaults to actions)'],
      ['sticky', 'boolean'],
      ['bordered', 'boolean'],
      ['renderLink', '(p: { href, className, aria-current, onClick, children }) => ReactNode'],
      ['menuLabel', 'string = m.menu'],
    ],
  },
  {
    name: 'Breadcrumb',
    group: 'navigation',
    className: 'nui-breadcrumb',
    description: 'Trail of links separated by decorative slashes. The last item is the current page: a span with aria-current="page".',
    Demo: () => (
      <Breadcrumb
        items={[
          { label: 'Explorer', href: '#/c/breadcrumb' },
          { label: 'Blocks', href: '#/c/breadcrumb' },
          { label: 'Block 2,841,092' },
        ]}
      />
    ),
    usage: `<Breadcrumb items={[{ label: 'Explorer', href: '/explorer' }, { label: 'Block 2,841,092' }]} />`,
    props: [
      ['items', 'Array<{ label, href? }>'],
      ['renderLink', 'RenderLink'],
    ],
  },
  {
    name: 'Footer',
    group: 'navigation',
    className: 'nui-footer',
    description: 'Black footer in both themes: brand + tagline, link columns, legal row. The affiliation disclaimer is always rendered; it may be reworded but never removed.',
    Demo: () => (
      <Footer
        brand={<Brand name="Noir" sub="NUI3" />}
        tagline="An open ecosystem for privacy-native applications. NUI3 reference interfaces use sample data only."
        columns={FOOTER_COLS}
        legal="© 2026 Noir · Open ecosystem · Sample data only"
      />
    ),
    usage: `<Footer brand={<Brand name="Noir" />} tagline="…" columns={[{ title: 'Discover', links: [{ label: 'Overview', href: '/' }] }]}
  legal="© 2026 Noir · Sample data only" />  // disclaimer defaults to m.disclaimer`,
    props: [
      ['brand', 'ReactNode'],
      ['tagline', 'ReactNode'],
      ['columns', 'Array<{ title, links: { label, href }[] }>'],
      ['legal', 'ReactNode'],
      ['disclaimer', 'ReactNode = m.disclaimer — empty values fall back to the default'],
      ['renderLink', 'RenderLink'],
    ],
  },
  {
    name: 'SubNav',
    group: 'navigation',
    className: 'nui-subnav',
    description: 'In-product page navigation. These are links (aria-current="page"), not tabs; the strip scrolls horizontally on narrow screens.',
    Demo: SubNavDemo,
    usage: `<SubNav label="Lending" items={[{ label: 'Markets', href: '/lend', current: true }, { label: 'Positions', href: '/lend/positions', badge: 2 }]} />`,
    props: [
      ['items', 'Array<{ label, href, current?, badge? }>'],
      ['label', 'string — nav aria-label'],
      ['renderLink', 'RenderLink'],
    ],
  },
]
