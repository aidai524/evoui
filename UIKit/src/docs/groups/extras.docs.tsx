import { useMemo, useState, type ComponentType, type SVGProps } from 'react'
import * as Icons from '../../nui3/icons'
import { Button, Cluster, SearchInput, Segmented, Spinner, SpinnerIcon, Stack, useCopy } from '../../nui3'
import type { ComponentDoc } from '../types'

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>

/** Alternative names exported for the same component. */
const ALIASES = new Set(['AlertIcon', 'CheckCircleIcon', 'ChevronDownIcon'])

/** Every exported *Icon, aliases folded into their primary name ("Error = Alert"). */
const GALLERY: { name: string; aliases: string[]; Icon: IconComponent }[] = (() => {
  const out: { name: string; aliases: string[]; Icon: IconComponent }[] = []
  const entries = (Object.entries(Icons) as [string, IconComponent][]).sort(([a], [b]) => Number(ALIASES.has(a)) - Number(ALIASES.has(b)))
  for (const [name, Icon] of entries) {
    if (!name.endsWith('Icon') || typeof Icon !== 'function') continue
    const prev = out.find((e) => e.Icon === Icon)
    if (prev) prev.aliases.push(name)
    else out.push({ name, aliases: [], Icon })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
})()

const SIZES = ['12', '14', '16', '20', '24'] as const
const TONES = {
  text: 'var(--nui-text)',
  muted: 'var(--nui-text-muted)',
  accent: 'var(--nui-accent-text)',
  positive: 'var(--nui-positive)',
  negative: 'var(--nui-negative)',
} as const

function IconsDemo() {
  const [query, setQuery] = useState('')
  const [size, setSize] = useState<(typeof SIZES)[number]>('16')
  const [tone, setTone] = useState<keyof typeof TONES>('text')
  const [last, setLast] = useState('')
  const { copied, copy } = useCopy()
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/icon$/, '')
    return q ? GALLERY.filter((e) => [e.name, ...e.aliases].some((n) => n.toLowerCase().includes(q))) : GALLERY
  }, [query])

  return (
    <Stack gap={5}>
      <Cluster gap={4}>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <SearchInput label="Search icons" placeholder={`Search ${GALLERY.length} icons`} value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} />
        </div>
        <Segmented label="Icon size" value={size} onChange={setSize} options={SIZES.map((s) => ({ value: s, label: `${s}` }))} />
        <Segmented label="Icon colour" value={tone} onChange={setTone} options={Object.keys(TONES).map((t) => ({ value: t as keyof typeof TONES, label: t }))} />
      </Cluster>
      <p className="nui-text-small nui-text-muted" aria-live="polite">
        {copied && last ? `Copied: import { ${last} } from '@nui3/react'` : 'Click an icon to copy its import.'}
      </p>
      {shown.length === 0 ? (
        <p className="nui-text-small nui-text-muted" role="status">
          No icons match “{query}”.
        </p>
      ) : (
        <ul className="nui-docs__icons" style={{ color: TONES[tone] }}>
          {shown.map(({ name, aliases, Icon }) => (
            <li key={name}>
              <button
                type="button"
                className="nui-docs__icon"
                data-copied={(copied && last === name) || undefined}
                title={`import { ${name} } from '@nui3/react'`}
                onClick={() => {
                  setLast(name)
                  void copy(`import { ${name} } from '@nui3/react'`)
                }}
              >
                <span className="nui-docs__icon-glyph">
                  <Icon size={Number(size)} />
                </span>
                <span className="nui-docs__icon-name">{copied && last === name ? 'Copied' : name.replace(/Icon$/, '')}</span>
                {aliases.length > 0 && <span className="nui-docs__icon-alias">= {aliases.map((a) => a.replace(/Icon$/, '')).join(', ')}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}

function SpinnerDemo() {
  const [busy, setBusy] = useState(false)
  return (
    <Stack gap={6}>
      <Cluster gap={8}>
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
        <span style={{ color: 'var(--nui-accent-text)' }}>
          <Spinner size="lg" label="Syncing notes" />
        </span>
        <span className="nui-text-small nui-text-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <SpinnerIcon size={14} /> SpinnerIcon (svg)
        </span>
      </Cluster>
      <Cluster gap={4}>
        <Button
          variant="outline"
          loading={busy}
          onClick={() => {
            setBusy(true)
            setTimeout(() => setBusy(false), 1600)
          }}
        >
          Button loading uses the same ring
        </Button>
      </Cluster>
    </Stack>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'Icons',
    group: 'foundation',
    className: '',
    description:
      'Inline SVG icons: fill none, stroke currentColor 1.4, square caps, aria-hidden + focusable=false by default. Colour always follows currentColor; `size` scales the longest side. Icon-only buttons go in an IconButton with a label. Click a tile to copy its import.',
    Demo: IconsDemo,
    usage: `import { CopyIcon, WarningIcon, SpinnerIcon } from '@nui3/react'

<CopyIcon />                 // native size (14px)
<WarningIcon size={16} />    // scaled
<IconButton label="Refresh"><RefreshIcon /></IconButton>`,
    props: [
      ['size', 'number — px of the longest side (default: the icon’s own viewBox)'],
      ['…svg props', 'className, style, strokeWidth, aria-* (aria-hidden defaults to true)'],
    ],
  },
  {
    name: 'Spinner',
    group: 'foundation',
    className: 'nui-spinner',
    description:
      'Rotating ring (the same .nui-spinner that Button loading uses), inherits currentColor. role="status" with a visually hidden label (default "Loading"); label={null} makes it decorative. Static under prefers-reduced-motion. Prefer Skeleton for content placeholders.',
    Demo: SpinnerDemo,
    usage: `import { Spinner } from '@nui3/react'

<Spinner />                        // md 16px, announces "Loading"
<Spinner size="lg" label="Syncing notes" />
<Spinner size="sm" label={null} /> // decorative`,
    props: [
      ['size', "'sm' | 'md' | 'lg' = 'md' (12 / 16 / 24px)"],
      ['label', 'string | null = m.loading'],
    ],
  },
]
