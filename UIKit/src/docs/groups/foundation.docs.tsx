import { Cluster, Display, Eyebrow, Grid, Heading, Lead, Section, Shell, Stack } from '../../nui3'
import type { ComponentDoc } from '../types'

const Box = ({ children }: { children: string }) => (
  <div style={{ padding: 'var(--nui-space-4)', border: '1px solid var(--nui-border)', background: 'var(--nui-surface)' }} className="nui-text-small">
    {children}
  </div>
)

export const docs: ComponentDoc[] = [
  {
    name: 'Display',
    group: 'foundation',
    className: 'nui-display',
    description: 'Serif page and section titles only. Never body copy or buttons. Sentence case, ends with a full stop.',
    Demo: () => (
      <Stack gap={3}>
        <Display size="l">Private by default.</Display>
        <Display>Shielded payments, plainly.</Display>
        <Display size="s">Build a Zcash app in an afternoon.</Display>
      </Stack>
    ),
    usage: `import { Display } from '@nui3/react'\n\n<Display size="l">Private by default.</Display>`,
    props: [
      ['size', "'xl' | 'l' | 'm' | 's' = 'm'"],
      ['as', "ElementType = 'h1'"],
    ],
  },
  {
    name: 'Heading',
    group: 'foundation',
    className: 'nui-heading',
    description: 'Inter section (h2), card (h3) and subsection (h4) headings.',
    Demo: () => (
      <Stack gap={3}>
        <Heading>Section heading</Heading>
        <Heading level={3}>Card heading</Heading>
        <Heading level={4}>Subsection heading</Heading>
      </Stack>
    ),
    usage: `<Heading level={3}>Route health</Heading>`,
    props: [['level', '2 | 3 | 4 = 2']],
  },
  {
    name: 'Eyebrow',
    group: 'foundation',
    className: 'nui-eyebrow',
    description: '12px uppercase label with 0.16em tracking. The accent variant uses accent-text for contrast.',
    Demo: () => (
      <Stack gap={2}>
        <Eyebrow>Bridge · Phase 1</Eyebrow>
        <Eyebrow accent>Sample data</Eyebrow>
      </Stack>
    ),
    usage: `<Eyebrow accent>Bridge · Phase 1</Eyebrow>`,
    props: [['accent', 'boolean']],
  },
  {
    name: 'Lead',
    group: 'foundation',
    className: 'nui-lead',
    description: 'Intro paragraph: 18px / 1.72, text-secondary, max 52ch.',
    Demo: () => <Lead>Move ZEC between the shielded pool and Noir. Every route shows where privacy changes before you sign.</Lead>,
    usage: `<Lead>Move ZEC between the shielded pool and Noir.</Lead>`,
  },
  {
    name: 'Shell',
    group: 'foundation',
    className: 'nui-shell',
    description: 'Content container: min(100% − 2 × gutter, 1360px), centred.',
    Demo: () => (
      <Shell style={{ outline: '1px dashed var(--nui-border-strong)' }}>
        <Box>Shell content</Box>
      </Shell>
    ),
    usage: `<Shell>…</Shell>`,
    props: [['as', "ElementType = 'div'"]],
  },
  {
    name: 'Section',
    group: 'foundation',
    className: 'nui-section',
    description: 'Marketing-rhythm block with section-y padding. Dark tones (plum, navy) are never adjacent to each other.',
    Demo: () => (
      <div>
        <Section tone="plum" style={{ paddingBlock: 'var(--nui-space-8)' }}>
          <Stack gap={2}>
            <Eyebrow accent>Plum section</Eyebrow>
            <Display size="s">Stays dark in both themes.</Display>
            <Lead>Secondary text switches to night-text-2 inside brand sections.</Lead>
          </Stack>
        </Section>
        <Section tone="inverse" style={{ paddingBlock: 'var(--nui-space-8)' }}>
          <Stack gap={2}>
            <Eyebrow>Inverse section</Eyebrow>
            <Display size="s">Flips with the theme.</Display>
          </Stack>
        </Section>
      </div>
    ),
    usage: `<Section tone="navy">…</Section>`,
    props: [
      ['tone', "'default' | 'inverse' | 'plum' | 'navy'"],
      ['contained', 'boolean = true (wraps children in Shell)'],
    ],
  },
  {
    name: 'Stack',
    group: 'foundation',
    className: 'nui-stack',
    description: 'Vertical flex with a gap from the space scale. Portal pages use gap 8 (32px); product pages gap 6 (24px).',
    Demo: () => (
      <Stack gap={3}>
        <Box>One</Box>
        <Box>Two</Box>
        <Box>Three</Box>
      </Stack>
    ),
    usage: `<Stack gap={6}>…</Stack>`,
    props: [['gap', 'SpaceStep = 4 (16px)']],
  },
  {
    name: 'Cluster',
    group: 'foundation',
    className: 'nui-cluster',
    description: 'Horizontal wrap with centred alignment.',
    Demo: () => (
      <Cluster gap={3}>
        <Box>Alpha</Box>
        <Box>Beta</Box>
        <Box>Gamma</Box>
      </Cluster>
    ),
    usage: `<Cluster gap={4} justify="space-between">…</Cluster>`,
    props: [
      ['gap', 'SpaceStep = 3 (12px)'],
      ['justify', 'CSS justify-content'],
    ],
  },
  {
    name: 'Grid',
    group: 'foundation',
    className: 'nui-grid',
    description: '20px gap; 3/4 columns collapse to 2 at 1080px and 1 at 640px. Never inline --nui-cols on pages.',
    Demo: () => (
      <Grid cols={3}>
        {['01', '02', '03', '04', '05', '06'].map((n) => (
          <Box key={n}>{n}</Box>
        ))}
      </Grid>
    ),
    usage: `<Grid cols={3}>…</Grid>\n<Grid cols="auto" min="240px">…</Grid>`,
    props: [
      ['cols', "1 | 2 | 3 | 4 | 'auto' = 3"],
      ['min', "string (auto only) = '280px'"],
    ],
  },
]
