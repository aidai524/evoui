import { useInsertionEffect, type CSSProperties, type ReactNode } from 'react'
import { camelToKebab, cx } from '../utils/cx'
import { BUILTIN_THEMES, type ThemeTokens } from './tokens.generated'

export type ThemeName = 'paper' | 'night' | 'auto' | (string & {})
export type TokenOverrides = Record<string, string>

/** { accentHover: '#…' } / { 'accent-hover': '#…' } → { '--nui-accent-hover': '#…' } */
export function toCssVars(map: TokenOverrides): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(map)) out[`--nui-${camelToKebab(k).replace(/^--nui-/, '')}`] = v
  return out
}

export interface ThemeProviderProps {
  theme?: ThemeName
  density?: 'comfortable' | 'compact'
  tokens?: TokenOverrides
  /** Emit the .nui-root scope (background + type). Default true. */
  root?: boolean
  className?: string
  children?: ReactNode
}

/** Scopes theme, density and token overrides to a subtree. Inner providers win over <html data-nui-theme>. */
export function ThemeProvider({ theme = 'paper', density = 'comfortable', tokens, root = true, className, children }: ThemeProviderProps) {
  const style = tokens ? (toCssVars(tokens) as CSSProperties) : undefined
  return (
    <div
      className={cx(root && 'nui-root', className)}
      data-nui-theme={theme}
      data-nui-density={density === 'compact' ? 'compact' : undefined}
      style={style}
    >
      {children}
    </div>
  )
}

export interface DefinedTheme {
  name: string
  /** Fully resolved semantic tokens (base theme + overrides). */
  tokens: ThemeTokens
  /** `@layer nui3.theme { [data-nui-theme="name"] { … } }` */
  css: string
  /** var() references by token name, for inline styles. */
  refs: Record<string, string>
}

/** Named theme built on paper/night. Inject `css` once (useThemeStyle) and set data-nui-theme={name}. */
export function defineTheme({ name, extends: base = 'paper', tokens }: { name: string; extends?: 'paper' | 'night'; tokens: TokenOverrides }): DefinedTheme {
  const norm = Object.fromEntries(Object.entries(tokens).map(([k, v]) => [camelToKebab(k), v]))
  const resolved = { ...BUILTIN_THEMES[base], ...norm }
  const scheme = base === 'night' ? 'dark' : 'light'
  const body = Object.entries(resolved)
    .map(([k, v]) => `--nui-${k}: ${v};`)
    .join(' ')
  return {
    name,
    tokens: resolved,
    css: `@layer nui3.theme { [data-nui-theme="${name}"] { color-scheme: ${scheme}; ${body} } }`,
    refs: Object.fromEntries(Object.keys(resolved).map((k) => [k, `var(--nui-${k})`])),
  }
}

/** Injects a defineTheme() stylesheet into <head> once per theme name. */
export function useThemeStyle(theme: DefinedTheme | null | undefined) {
  useInsertionEffect(() => {
    if (!theme) return
    const id = `nui-theme-${theme.name}`
    let el = document.getElementById(id) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = id
      document.head.appendChild(el)
    }
    el.textContent = theme.css
  }, [theme?.name, theme?.css])
}
