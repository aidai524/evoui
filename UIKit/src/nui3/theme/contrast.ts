// WCAG contrast utilities and the 23-pair matrix every theme must pass (02 §5).
import type { ThemeTokens } from './tokens.generated'

function parseColor(c: string): [number, number, number] {
  const s = c.trim()
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (x) => x + x) : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  throw new Error(`Unsupported colour: ${c}`)
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(parseColor(fg))
  const b = luminance(parseColor(bg))
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

export interface ContrastRule {
  fg: string
  bg: string
  min: number
}

const on = (fgs: string[], bgs: string[], min: number): ContrastRule[] => fgs.flatMap((fg) => bgs.map((bg) => ({ fg, bg, min })))

export const CONTRAST_MATRIX: ContrastRule[] = [
  ...on(['text'], ['bg', 'surface'], 7),
  ...on(['text-secondary', 'text-muted', 'accent-text'], ['bg', 'surface'], 4.5),
  { fg: 'on-accent', bg: 'accent', min: 4.5 },
  ...on(['positive', 'negative', 'info'], ['surface'], 4.5),
  ...on(['privacy-shielded', 'privacy-confidential', 'privacy-public'], ['surface'], 4.5),
  { fg: 'inverse-text', bg: 'inverse-bg', min: 7 },
  ...on(['inverse-text-secondary', 'inverse-accent-text'], ['inverse-bg'], 4.5),
  ...on(['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'], ['surface'], 3),
]

export interface ContrastResult extends ContrastRule {
  ratio: number
  pass: boolean
}

/** Runs the matrix against a resolved token map (keys without --nui-). */
export function checkContrast(tokens: ThemeTokens): { pass: boolean; results: ContrastResult[] } {
  const results = CONTRAST_MATRIX.map((r) => {
    const ratio = contrastRatio(tokens[r.fg], tokens[r.bg])
    return { ...r, ratio, pass: ratio >= r.min }
  })
  return { pass: results.every((r) => r.pass), results }
}
