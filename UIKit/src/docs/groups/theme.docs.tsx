import { Eyebrow, Lead, LocaleProvider, Stack, ThemeProvider, useNuiLocale } from '../../nui3'
import type { ComponentDoc } from '../types'

function LocaleSample() {
  const { m, number } = useNuiLocale()
  return (
    <p className="nui-text-small">
      {m.copyAddress} · {m.txConfirmed} · {m.privacyShielded} · {number(1234567.89)}
    </p>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'ThemeProvider',
    group: 'theme',
    className: 'nui-root',
    description: 'Scopes theme, density and token overrides to a subtree. Emits .nui-root so embedded subtrees get background and type.',
    Demo: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--nui-grid-gap)' }}>
        {(['paper', 'night'] as const).map((t) => (
          <ThemeProvider key={t} theme={t}>
            <Stack gap={2} style={{ padding: 'var(--nui-card-pad)', border: '1px solid var(--nui-border)' }}>
              <Eyebrow accent>{t}</Eyebrow>
              <Lead>Same components, re-mapped tokens.</Lead>
            </Stack>
          </ThemeProvider>
        ))}
        <ThemeProvider theme="night" tokens={{ accent: '#7ee0c3', accentHover: '#5fcfae', accentText: '#7ee0c3', focusRing: '#7ee0c3' }}>
          <Stack gap={2} style={{ padding: 'var(--nui-card-pad)', border: '1px solid var(--nui-border)' }}>
            <Eyebrow accent>night + jade tokens</Eyebrow>
            <Lead>Runtime overrides become inline CSS variables.</Lead>
          </Stack>
        </ThemeProvider>
      </div>
    ),
    usage: `import { ThemeProvider, defineTheme, checkContrast } from '@nui3/react'

<ThemeProvider theme="auto" density="compact">…</ThemeProvider>

const jade = defineTheme({ name: 'jade', extends: 'night',
  tokens: { accent: '#7ee0c3', 'accent-hover': '#5fcfae', 'accent-text': '#7ee0c3', 'focus-ring': '#7ee0c3' } })
checkContrast(jade.tokens).pass // run the 23-pair matrix`,
    props: [
      ['theme', "'paper' | 'night' | 'auto' | string = 'paper'"],
      ['density', "'comfortable' | 'compact'"],
      ['tokens', 'Record<string, string> (camelCase or kebab-case, --nui- added)'],
      ['root', 'boolean = true'],
    ],
  },
  {
    name: 'LocaleProvider / useNuiLocale',
    group: 'i18n',
    className: '',
    description: 'Message catalogue (en / zh) and Intl formatting for every component. zh-* picks the Chinese pack; syncs <html lang>.',
    Demo: () => (
      <Stack gap={2}>
        <LocaleSample />
        <LocaleProvider locale="zh" syncDocumentLang={false}>
          <LocaleSample />
        </LocaleProvider>
      </Stack>
    ),
    usage: `<LocaleProvider locale="zh" messages={{ copy: '拷贝' }}>…</LocaleProvider>

const { m, number, t } = useNuiLocale()
t('Bridge', '跨链桥')`,
    props: [
      ['locale', "BCP-47 string = 'en'"],
      ['base', 'Messages (replace whole catalogue)'],
      ['messages', 'Partial<Messages> (overrides)'],
      ['syncDocumentLang', 'boolean = true'],
    ],
  },
]
