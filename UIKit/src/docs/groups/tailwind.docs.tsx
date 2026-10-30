import { Badge, Button, Cluster, Panel, Stack } from '../../nui3'
import type { ComponentDoc } from '../types'

function TailwindDemo() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {/* 1. Default */}
      <Panel title="Default">
        <Stack gap={3}>
          <p className="m-0 text-nui-small text-nui-text-secondary">Kit styles only.</p>
          <Cluster gap={3}>
            <Button variant="solid" size="sm">
              Swap
            </Button>
            <Badge tone="positive">Shielded</Badge>
          </Cluster>
        </Stack>
      </Panel>

      {/* 2. Utilities on components: they win over the nui3 layer */}
      <Panel title="Utilities on components" className="rounded-xl shadow-lg">
        <Stack gap={3}>
          <p className="m-0 text-nui-small text-nui-text-secondary">className utilities override the component layer.</p>
          <Cluster gap={3}>
            <Button variant="solid" size="sm" className="rounded-pill px-8 tracking-normal normal-case">
              Swap
            </Button>
            <Badge tone="positive" className="rounded-pill">
              Shielded
            </Badge>
          </Cluster>
        </Stack>
      </Panel>

      {/* 3. Re-theme a subtree by overriding tokens with arbitrary properties */}
      <div className="[--nui-accent:#7c5cff] [--nui-accent-hover:#6a48f5] [--nui-accent-text:#5b3fe0] [--nui-focus-ring:#7c5cff] [--nui-radius-base:12px] [--nui-radius-control:999px]">
        <Panel title="Token overrides">
          <Stack gap={3}>
            <p className="m-0 text-nui-small text-nui-text-secondary">One wrapper re-themes everything inside.</p>
            <Cluster gap={3}>
              <Button variant="solid" size="sm">
                Swap
              </Button>
              <Button variant="outline" size="sm">
                Details
              </Button>
            </Cluster>
          </Stack>
        </Panel>
      </div>
    </div>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'Tailwind',
    group: 'theme',
    className: '',
    description:
      'Tailwind v4 integration for per-product differentiation: tokens are exposed as utilities (bg-nui-surface, text-nui-text-muted, rounded-control, ease-nui-out …) that resolve to CSS variables, and the layer order puts utilities after the component layer, so className on any component wins without !important.',
    Demo: TailwindDemo,
    usage: `/* app.css — replaces nui3.css (it includes it) */
@import "@nui3/css/tailwind.css";

// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
plugins: [react(), tailwindcss()]

// 1. Utilities on a component override it
<Button variant="solid" className="rounded-pill px-8">Swap</Button>

// 2. Style inner parts with descendant variants
<TokenAmountInput className="[&_.nui-token-input__amount]:text-4xl" … />

// 3. Re-theme a subtree: tokens are CSS variables
<div className="[--nui-accent:#7c5cff] [--nui-radius-control:999px]">…</div>

// 4. Token utilities for your own layout
<section className="bg-nui-surface-sunken text-nui-text border border-nui-border p-nui-6 font-display text-nui-h3" />`,
    props: [
      ['colors', 'bg-/text-/border-nui-{bg, surface, surface-raised, surface-sunken, text, text-secondary, text-muted, border, accent, positive, negative, privacy-*, chart-* …}'],
      ['type', 'font-display / font-sans / font-mono; text-nui-{display-xl … micro}'],
      ['spacing', 'p-nui-4, gap-nui-6 … (base.space scale)'],
      ['radius', 'rounded / rounded-base / rounded-control / rounded-pill'],
      ['motion', 'ease-nui, ease-nui-out, ease-nui-in, ease-nui-spring; duration-nui-instant/-fast/ /-slow'],
      ['layout', 'max-w-container, z-nui-sticky/-overlay/-toast'],
      ['layers', '@layer theme, base, nui3, components, utilities — utilities always beat nui3'],
    ],
  },
]
