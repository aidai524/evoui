// Acceptance checks from spec/00 + 01 R1/R3 that can be automated over the component CSS.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = join(__dirname, '../src/nui3/css/components')
const files = readdirSync(dir).filter((f) => f.endsWith('.css'))
/** Split on commas that are not inside parentheses (color-mix(), var() nest). */
const splitTopLevel = (v: string) => {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of v) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  return [...out, cur]
}
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

/** R1 exceptions: QR quiet zone + caption, footer greys on black. */
const ALLOWED_LITERALS: Record<string, RegExp[]> = {
  'zcash.css': [/#fff\b/i, /#ffffff\b/i, /#5c5357\b/i],
  'navigation.css': [/#cbcbcb\b/i, /#9a9a9a\b/i, /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*\.?0?\.16\s*\)/i],
}

describe.each(files)('%s', (file) => {
  const css = strip(readFileSync(join(dir, file), 'utf8'))
  const allowed = ALLOWED_LITERALS[file] ?? []

  it('has no colour literals outside the R1 exceptions', () => {
    const hits = [...css.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi)].map((m) => m[0]).filter((h) => !allowed.some((re) => re.test(h)))
    expect(hits).toEqual([])
  })

  it('uses box-shadow only for inset rules or focus rings', () => {
    const bad = [...css.matchAll(/box-shadow\s*:\s*([^;}]+)/gi)]
      .map((m) => m[1].trim())
      .filter((v) => v !== 'none' && !splitTopLevel(v).every((part) => /^\s*(inset\b|0 0 0 )/.test(part)))
    expect(bad).toEqual([])
  })

  it('has no pixel border radius (tokens only)', () => {
    const bad = [...css.matchAll(/border-radius\s*:\s*([^;}]+)/gi)].map((m) => m[1].trim()).filter((v) => !/^(0|0px|var\(--nui-radius-[a-z]+\)|50%)$/.test(v))
    expect(bad).toEqual([])
  })

  it('only styles nui-* classes', () => {
    // Selector text only: whatever precedes each "{", minus at-rules and keyframe steps.
    const selectors = [...css.matchAll(/([^{};]+)\{/g)].map((m) => m[1].trim()).filter((s) => !s.startsWith('@') && !/^(from|to|\d+%)/.test(s))
    const classes = selectors.flatMap((s) => [...s.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]))
    const foreign = [...new Set(classes.filter((c) => !c.startsWith('nui-') && !['is-num'].includes(c)))]
    expect(foreign).toEqual([])
  })

  it('does not use !important (consumers override without it)', () => {
    if (file === 'foundation.css') return // .nui-sr-only position is the only sanctioned use
    expect(css.includes('!important')).toBe(false)
  })

  it('keeps every rule inside @layer nui3.components', () => {
    const outside = css.replace(/@layer\s+nui3\.components\s*\{[\s\S]*$/m, '').replace(/@media[^{]*\{\s*$/m, '').trim()
    expect(outside).toBe('')
  })
})
