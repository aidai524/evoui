// Component docs site (spec/05 §4–5), built only from NUI3 components.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardLink,
  Cluster,
  CodeBlock,
  DataTable,
  defineTheme,
  Display,
  Drawer,
  Eyebrow,
  Footer,
  Grid,
  Header,
  Heading,
  Lead,
  LocaleProvider,
  SearchInput,
  Segmented,
  Shell,
  Stack,
  Switch,
  ToastProvider,
  useNuiLocale,
  useThemeStyle,
} from '../nui3'
import { REGISTRY } from './registry'
import { GROUPS, slug, type ComponentDoc } from './types'

const REPO = 'https://github.com/aidai524/evoui/tree/main/UIKit'

const JADE = defineTheme({
  name: 'jade',
  extends: 'night',
  tokens: { accent: '#7ee0c3', 'accent-hover': '#5fcfae', 'accent-text': '#7ee0c3', 'focus-ring': '#7ee0c3', 'chart-1': '#7ee0c3' },
})

type ThemeChoice = 'paper' | 'night' | 'custom'
type Route = { kind: 'index' } | { kind: 'component'; doc: ComponentDoc } | { kind: 'guide'; id: 'getting-started' | 'ai-integration' } | { kind: 'missing' }

const GUIDES = [
  { id: 'getting-started' as const, title: 'Getting started', zh: '快速开始' },
  { id: 'ai-integration' as const, title: 'AI integration', zh: 'AI 接入' },
]

function useHashRoute(): [string, (h: string) => void] {
  const [h, setH] = useState(() => location.hash.slice(1) || '/')
  useEffect(() => {
    const on = () => {
      setH(location.hash.slice(1) || '/')
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return [h, (next) => (location.hash = next)]
}

function resolve(path: string): Route {
  if (path === '/' || path === '') return { kind: 'index' }
  const c = path.match(/^\/c\/(.+)$/)
  if (c) {
    const doc = REGISTRY.find((d) => slug(d.name) === c[1])
    return doc ? { kind: 'component', doc } : { kind: 'missing' }
  }
  const g = path.match(/^\/guides\/(getting-started|ai-integration)$/)
  if (g) return { kind: 'guide', id: g[1] as 'getting-started' | 'ai-integration' }
  return { kind: 'missing' }
}

export function DocsSite() {
  const [lang, setLang] = useState<'en' | 'zh'>('en')
  const [theme, setTheme] = useState<ThemeChoice>('paper')
  const [compact, setCompact] = useState(false)
  useThemeStyle(theme === 'custom' ? JADE : null)

  useEffect(() => {
    const el = document.documentElement
    el.dataset.nuiTheme = theme === 'custom' ? JADE.name : theme
    if (compact) el.dataset.nuiDensity = 'compact'
    else delete el.dataset.nuiDensity
  }, [theme, compact])

  return (
    <LocaleProvider locale={lang}>
      <ToastProvider>
        <Site lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} compact={compact} setCompact={setCompact} />
      </ToastProvider>
    </LocaleProvider>
  )
}

function Site(props: { lang: 'en' | 'zh'; setLang: (l: 'en' | 'zh') => void; theme: ThemeChoice; setTheme: (t: ThemeChoice) => void; compact: boolean; setCompact: (c: boolean) => void }) {
  const { t } = useNuiLocale()
  const [path] = useHashRoute()
  const route = resolve(path)
  const [drawer, setDrawer] = useState(false)

  const controls = (
    <>
      <Segmented
        label={t('Language', '语言')}
        value={props.lang}
        onChange={props.setLang}
        options={[
          { value: 'en', label: 'EN' },
          { value: 'zh', label: '中文' },
        ]}
      />
      <Segmented
        label={t('Theme', '主题')}
        value={props.theme}
        onChange={props.setTheme}
        options={[
          { value: 'paper', label: t('Paper', '纸白') },
          { value: 'night', label: t('Night', '夜间') },
          { value: 'custom', label: t('Custom', '自定义') },
        ]}
        data-testid="theme-switch"
      />
    </>
  )

  return (
    <>
      <Header
        sticky
        bordered
        brand={{ name: 'Noir', sub: 'NUI3', href: '#/' }}
        menuLabel={t('Menu', '菜单')}
        nav={[
          { label: t('Components', '组件'), href: '#/', current: route.kind === 'index' || route.kind === 'component' },
          ...GUIDES.map((g) => ({ label: t(g.title, g.zh), href: `#/guides/${g.id}`, current: route.kind === 'guide' && route.id === g.id })),
        ]}
        actions={
          <Cluster gap={4}>
            {controls}
            <Button variant="outline" size="sm" href={REPO}>
              GitHub
            </Button>
          </Cluster>
        }
        mobileActions={
          <Stack gap={3}>
            {controls}
            <Button variant="outline" size="sm" href={REPO}>
              GitHub
            </Button>
          </Stack>
        }
      />

      <Shell className="nui-docs">
        <aside className="nui-docs__side" aria-label={t('Component navigation', '组件导航')}>
          <SideNav route={route} compact={props.compact} setCompact={props.setCompact} />
        </aside>
        <main className="nui-docs__main" id="main">
          <div className="nui-docs__drawer-btn">
            <Button variant="subtle" size="sm" onClick={() => setDrawer(true)}>
              {t('All components', '全部组件')}
            </Button>
          </div>
          {route.kind === 'index' && <IndexPage />}
          {route.kind === 'component' && <ComponentPage doc={route.doc} />}
          {route.kind === 'guide' && (route.id === 'getting-started' ? <GettingStarted /> : <AiIntegration />)}
          {route.kind === 'missing' && (
            <Stack gap={4}>
              <Display size="s">{t('Page not found.', '页面不存在。')}</Display>
              <Button variant="underline" href="#/" arrow>
                {t('All components', '全部组件')}
              </Button>
            </Stack>
          )}
        </main>
      </Shell>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={t('All components', '全部组件')} side="left">
        <div onClick={(e) => (e.target as HTMLElement).closest('a') && setDrawer(false)}>
          <SideNav route={route} compact={props.compact} setCompact={props.setCompact} />
        </div>
      </Drawer>

      <Footer
        brand={<span className="nui-docs__footer-brand">Noir · NUI3</span>}
        tagline={t(
          'An open ecosystem for privacy-native applications. NUI3 reference interfaces use sample data only.',
          '面向隐私原生应用的开放生态。NUI3 参考界面仅使用示例数据。',
        )}
        columns={[
          {
            title: t('Components', '组件'),
            links: GROUPS.slice(0, 6).map((g) => ({ label: g.title, href: `#/c/${slug(REGISTRY.find((d) => d.group === g.id)?.name ?? '')}` })),
          },
          {
            title: t('Domain', '领域'),
            links: GROUPS.slice(6, 12).map((g) => ({ label: g.title, href: `#/c/${slug(REGISTRY.find((d) => d.group === g.id)?.name ?? '')}` })),
          },
          {
            title: t('Develop', '开发'),
            links: [
              { label: t('Getting started', '快速开始'), href: '#/guides/getting-started' },
              { label: t('AI integration', 'AI 接入'), href: '#/guides/ai-integration' },
              { label: 'GitHub', href: REPO },
              { label: t('Specification', '规格'), href: `${REPO}/spec` },
            ],
          },
        ]}
        legal={t('© 2026 Noir · Open ecosystem · Sample data only', '© 2026 Noir · 开放生态 · 仅示例数据')}
      />
    </>
  )
}

function SideNav({ route, compact, setCompact }: { route: Route; compact: boolean; setCompact: (c: boolean) => void }) {
  const { t } = useNuiLocale()
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const match = (s: string) => !needle || s.toLowerCase().includes(needle)
  const activeSlug = route.kind === 'component' ? slug(route.doc.name) : null
  const guides = GUIDES.filter((g) => match(g.title) || match(g.zh))

  return (
    <Stack gap={5}>
      <SearchInput label={t('Search components', '搜索组件')} placeholder={t('Search components', '搜索组件')} shortcut={false} value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} />
      {guides.length > 0 && (
        <nav aria-label={t('Guides', '指南')}>
          <p className="nui-docs__group">{t('Guides', '指南')}</p>
          {guides.map((g) => (
            <a key={g.id} className="nui-docs__link" href={`#/guides/${g.id}`} aria-current={route.kind === 'guide' && route.id === g.id ? 'page' : undefined}>
              {t(g.title, g.zh)}
            </a>
          ))}
        </nav>
      )}
      {GROUPS.map((g) => {
        const items = REGISTRY.filter((d) => d.group === g.id && match(d.name))
        if (!items.length) return null
        return (
          <nav key={g.id} aria-label={g.title}>
            <p className="nui-docs__group">{g.title}</p>
            {items.map((d) => (
              <a key={d.name} className="nui-docs__link" href={`#/c/${slug(d.name)}`} aria-current={activeSlug === slug(d.name) ? 'page' : undefined}>
                {d.name}
              </a>
            ))}
          </nav>
        )
      })}
      {needle && !guides.length && !REGISTRY.some((d) => match(d.name)) && <p className="nui-text-small nui-text-muted">{t('No results', '没有结果')}</p>}
      <Switch checked={compact} onChange={setCompact} label={t('Compact density', '紧凑密度')} />
    </Stack>
  )
}

const INSTALL = `pnpm add @nui3/react @nui3/css

// app root, once
import '@nui3/css'                       // full bundle (fonts + tokens + reset + components)
// import '@nui3/css/components.css'     // embeddable: no global reset`

const THEMING = `<html data-nui-theme="auto">           // paper | night | auto

<ThemeProvider theme="night" density="compact" tokens={{ accent: '#7ee0c3' }}>
  <LocaleProvider locale="zh">…</LocaleProvider>
</ThemeProvider>

const jade = defineTheme({ name: 'jade', extends: 'night', tokens: { … } })
checkContrast(jade.tokens).pass        // 23-pair matrix`

function IndexPage() {
  const { t } = useNuiLocale()
  return (
    <Stack gap={8}>
      <Stack gap={4}>
        <Eyebrow accent>NUI3 · {REGISTRY.length} components</Eyebrow>
        <Display size="s">{t('Build a Zcash app in an afternoon.', '一个下午做出一个 Zcash 应用。')}</Display>
        <Lead>
          {t(
            'One token set, one component library and one set of copy rules for wallets, bridges, DEXs and explorers. Shielded, confidential and public data are always labelled for what they are.',
            '一套 token、一套组件、一套文案规则，覆盖钱包、跨链桥、DEX 与浏览器。屏蔽、机密与公开数据始终如实标注。',
          )}
        </Lead>
      </Stack>
      <Grid cols={2}>
        <GuideCard
          index={1}
          title={t('For developers', '给开发者')}
          desc={t('Install, configure the app root, compose a swap form, theme it, verify the build.', '安装、配置应用根、组合一个兑换表单、主题化、验证构建。')}
          href="#/guides/getting-started"
        />
        <GuideCard
          index={2}
          title={t('For coding agents', '给编码代理')}
          desc={t('Give an agent the right context and rules so its pages keep privacy, amounts and risk copy correct.', '给代理正确的上下文与规则，让它生成的页面在隐私、金额与风险文案上不出错。')}
          href="#/guides/ai-integration"
        />
      </Grid>
      <CodeBlock title={t('Install', '安装')} code={INSTALL} language="ts" />
      <Grid cols={3}>
        {GROUPS.map((g) => {
          const items = REGISTRY.filter((d) => d.group === g.id)
          return (
            <Card key={g.id} interactive>
              <div className="nui-card__head">
                <h3 className="nui-card__title">{g.title}</h3>
                <Badge>{items.length}</Badge>
              </div>
              <p className="nui-card__desc">{items.slice(0, 5).map((d) => d.name).join(', ')}{items.length > 5 ? '…' : ''}</p>
              <div className="nui-card__foot">
                <CardLink stretched href={`#/c/${slug(items[0]?.name ?? '')}`}>
                  {t('Open', '打开')}
                </CardLink>
              </div>
            </Card>
          )
        })}
      </Grid>
      <CodeBlock title={t('Themes and i18n', '主题与国际化')} code={THEMING} language="tsx" />
    </Stack>
  )
}

function GuideCard({ index, title, desc, href }: { index: number; title: string; desc: string; href: string }) {
  const { t } = useNuiLocale()
  return (
    <Card interactive>
      <span className="nui-card__index" aria-hidden="true">
        {String(index).padStart(2, '0')}
      </span>
      <h3 className="nui-card__title">{title}</h3>
      <p className="nui-card__desc">{desc}</p>
      <div className="nui-card__foot">
        <CardLink stretched href={href}>
          {t('Read guide', '阅读指南')}
        </CardLink>
      </div>
    </Card>
  )
}

function ComponentPage({ doc }: { doc: ComponentDoc }) {
  const { t } = useNuiLocale()
  const i = REGISTRY.indexOf(doc)
  const prev = REGISTRY[i - 1]
  const next = REGISTRY[i + 1]
  const group = GROUPS.find((g) => g.id === doc.group)!
  const importNames = doc.name.split(/\s*\/\s*/).join(', ')
  const usage = doc.usage.includes('import ') ? doc.usage : `import { ${importNames} } from '@nui3/react'\n\n${doc.usage}`

  return (
    <Stack gap={8}>
      <Stack gap={4}>
        <Cluster gap={4}>
          <Badge tone="accent">{group.title}</Badge>
          {doc.className && <code className="nui-mono nui-text-muted">.{doc.className}</code>}
        </Cluster>
        <Display size="s">{doc.name}</Display>
        <Lead>{doc.description}</Lead>
      </Stack>

      <section className="nui-docs__section" aria-labelledby="demo-h">
        <Eyebrow as="h2" id="demo-h">
          {t('Live demo', '实时演示')}
        </Eyebrow>
        <div className="nui-docs__demo" data-testid="demo">
          {doc.Demo ? <doc.Demo /> : <p className="nui-text-small nui-text-muted">{t('No visual demo for this utility.', '此工具没有可视化演示。')}</p>}
        </div>
      </section>

      <section className="nui-docs__section" aria-labelledby="usage-h">
        <Eyebrow as="h2" id="usage-h">
          {t('Usage', '用法')}
        </Eyebrow>
        <CodeBlock code={usage} language="tsx" />
      </section>

      {doc.props && doc.props.length > 0 && (
        <section className="nui-docs__section" aria-labelledby="props-h">
          <Eyebrow as="h2" id="props-h">
            {t('Props', '属性')}
          </Eyebrow>
          <DataTable
            rows={doc.props}
            rowKey={(r) => r[0]}
            columns={[
              { key: 'prop', header: t('Prop', '属性'), cell: (r) => <code className="nui-mono">{r[0]}</code> },
              { key: 'type', header: t('Type or signature', '类型或签名'), cell: (r) => <code className="nui-mono nui-text-secondary">{r[1]}</code> },
            ]}
          />
        </section>
      )}

      <Cluster justify="space-between">
        {prev ? (
          <Button variant="ghost" href={`#/c/${slug(prev.name)}`}>
            ← {prev.name}
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button variant="ghost" href={`#/c/${slug(next.name)}`} arrow>
            {next.name}
          </Button>
        )}
      </Cluster>
    </Stack>
  )
}

function GuideShell({ title, lead, children, other }: { title: string; lead: string; children: ReactNode; other: { href: string; label: string } }) {
  const { t } = useNuiLocale()
  return (
    <Stack gap={8}>
      <Stack gap={4}>
        <Cluster gap={3}>
          <Badge tone="accent">{t('Guide', '指南')}</Badge>
        </Cluster>
        <Display size="s">{title}</Display>
        <Lead>{lead}</Lead>
      </Stack>
      {children}
      <Cluster justify="space-between">
        <Button variant="underline" href={other.href} arrow>
          {other.label}
        </Button>
        <Button variant="underline" href={`${REPO}/README.md`} arrow>
          {t('View Markdown', '查看 Markdown')}
        </Button>
      </Cluster>
    </Stack>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="nui-docs__section" aria-labelledby={`step-${n}`}>
      <Heading level={3} id={`step-${n}`}>
        <span className="nui-docs__step">{n}</span>
        {title}
      </Heading>
      {children}
    </section>
  )
}

function GettingStarted() {
  const { t } = useNuiLocale()
  return (
    <GuideShell
      title={t('Getting started.', '快速开始。')}
      lead={t('Add NUI3 to a React app, wire the root once, and compose screens from components instead of one-off styles.', '把 NUI3 加进 React 应用，配置一次应用根，用组件而不是一次性样式组合页面。')}
      other={{ href: '#/guides/ai-integration', label: t('AI integration', 'AI 接入') }}
    >
      <Alert tone="info" title={t('Before npm publication', '发布到 npm 之前')}>
        {t('Packages are not on npm yet. Use the UIKit folder as a workspace package or copy src/nui3 into your app.', '包尚未发布到 npm。请把 UIKit 目录作为 workspace 包使用，或把 src/nui3 复制进你的应用。')}
      </Alert>
      <Step n={1} title={t('Install in a workspace', '在 workspace 中安装')}>
        <CodeBlock code={`# pnpm-workspace.yaml\npackages:\n  - "UIKit"\n\npnpm add @nui3/react@workspace:* react react-dom`} language="bash" />
      </Step>
      <Step n={2} title={t('Configure the app root', '配置应用根')}>
        <CodeBlock
          code={`import '@nui3/css'   // once
import { ThemeProvider, ToastProvider } from '@nui3/react'

createRoot(root).render(
  <ThemeProvider theme="auto">
    <ToastProvider>
      <App />
    </ToastProvider>
  </ThemeProvider>,
)`}
          language="tsx"
        />
      </Step>
      <Step n={3} title={t('Compose components', '组合组件')}>
        <CodeBlock
          code={`const [from, setFrom] = useState('')
<Panel title="Swap">
  <TokenAmountInput label="You pay" value={from} onChange={setFrom} token={zec}
    aside={<PrivacyBadge level="shielded" />} onMax={() => setFrom(formatUnits(balance, 8))} />
  <SwapSwitch onClick={flip} />
  <TokenAmountInput label="You receive" value={quote} readOnly token={usdc} />
  <DetailList items={[['Rate', '1 ZEC = 47.12 USDC'], ['Slippage', '0.5%']]} />
  <Button variant="solid" block arrow disabled={!tryParseUnits(from, 8)}>Swap</Button>
</Panel>`}
          language="tsx"
        />
      </Step>
      <Step n={4} title={t('Themes and embedding', '主题与嵌入')}>
        <CodeBlock code={THEMING} language="tsx" />
      </Step>
      <Step n={5} title={t('Verify', '验证')}>
        <CodeBlock code={`pnpm build     # tokens → type-check → bundle\npnpm test      # utils, contrast matrix (every theme), CSS rules\npnpm --filter dapp build`} language="bash" />
      </Step>
    </GuideShell>
  )
}

function AiIntegration() {
  const { t } = useNuiLocale()
  const componentsJson = useMemo(
    () =>
      JSON.stringify(
        REGISTRY.map((d) => ({ name: d.name, group: d.group, className: d.className, description: d.description, props: d.props ?? [] })),
        null,
        2,
      ),
    [],
  )
  const download = () => {
    const url = URL.createObjectURL(new Blob([componentsJson], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'components.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <GuideShell
      title={t('AI integration.', 'AI 接入。')}
      lead={t('Coding agents produce template-looking, privacy-unsafe screens unless they read the rules first. Give them the context, a standing rule and a precise prompt.', '编码代理如果不先读规则，就会产出模板感、隐私不安全的界面。给它上下文、常驻规则和精确的任务提示。')}
      other={{ href: '#/guides/getting-started', label: t('Getting started', '快速开始') }}
    >
      <Step n={1} title={t('Provide the right context', '提供正确的上下文')}>
        <p className="nui-text-secondary">
          {t('Read order: AGENTS.md → llms.txt → components.json → the closest product example.', '阅读顺序：AGENTS.md → llms.txt → components.json → 最接近的产品示例。')}
        </p>
        <Cluster gap={3}>
          <Button variant="outline" size="sm" href={`${REPO}/AGENTS.md`}>
            AGENTS.md
          </Button>
          <Button variant="outline" size="sm" href={`${REPO}/llms.txt`}>
            llms.txt
          </Button>
          <Button variant="outline" size="sm" onClick={download}>
            components.json
          </Button>
        </Cluster>
      </Step>
      <Step n={2} title={t('Add a persistent project rule', '添加常驻项目规则')}>
        <CodeBlock
          code={`# .cursor/rules or CLAUDE.md
Use NUI3 components only. No new colours, radii, shadows or one-off CSS.
One solid Button per view. Amounts are bigint base units; display with formatAmount.
Privacy words: shielded | confidential | public — never "private" or "anonymous".
Public pages show shielded amounts as "Shielded". Risk Alerts are mandatory.`}
          language="md"
        />
      </Step>
      <Step n={3} title={t('Use a task prompt', '使用任务提示')}>
        <CodeBlock
          code={`Build the Lending "Borrow" page with ProductShell. Main: Panel "Borrow" with TokenAmountInput,
HealthFactor (before → after), DetailList (rate, liquidation price), Alert tone="warning"
naming the liquidation price, one solid "Borrow" button. Side: Panel "Your position".
Use sample data and label it "Sample data".`}
          language="md"
        />
      </Step>
      <Step n={4} title={t('Preserve domain rules', '保留领域规则')}>
        <Cluster gap={3}>
          <Badge tone="accent">{t('Privacy wording', '隐私措辞')}</Badge>
          <Badge tone="accent">{t('bigint amounts', 'bigint 金额')}</Badge>
          <Badge tone="accent">{t('Explorer hides shielded data', '浏览器隐藏屏蔽数据')}</Badge>
          <Badge tone="accent">{t('Risk alerts', '风险提示')}</Badge>
        </Cluster>
      </Step>
      <Step n={5} title={t('Close the loop', '闭环验证')}>
        <p className="nui-text-secondary">
          {t(
            'Type-check and test, then look at the page in paper and night, compact density, keyboard only, and at 390px.',
            '先跑类型检查与测试，再在纸白与夜间主题、紧凑密度、纯键盘和 390px 下目视检查。',
          )}
        </p>
      </Step>
    </GuideShell>
  )
}
