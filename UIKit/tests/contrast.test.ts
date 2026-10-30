import { describe, expect, it } from 'vitest'
import { BUILTIN_THEMES, checkContrast, CONTRAST_MATRIX, defineTheme } from '../src/nui3/theme'

const themes = {
  ...BUILTIN_THEMES,
  jade: defineTheme({
    name: 'jade',
    extends: 'night',
    tokens: { accent: '#7ee0c3', 'accent-hover': '#5fcfae', 'accent-text': '#7ee0c3', 'focus-ring': '#7ee0c3', 'chart-1': '#7ee0c3' },
  }).tokens,
}

describe('contrast matrix (02 §5)', () => {
  it('has the 23 required pairs', () => {
    expect(CONTRAST_MATRIX).toHaveLength(23)
  })

  for (const [name, tokens] of Object.entries(themes)) {
    it(`${name} passes every pair`, () => {
      const { results } = checkContrast(tokens)
      const failing = results.filter((r) => !r.pass).map((r) => `${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)} < ${r.min}`)
      expect(failing).toEqual([])
    })
  }
})
