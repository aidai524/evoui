import { describe, expect, it } from 'vitest'
import { fiatValue, formatFiatDecimal, formatUnits, mulDecimal, percentOf, toDecimalString } from '../src/nui3/utils'

describe('decimal fiat math', () => {
  it('multiplies without float error', () => {
    expect(0.1 * 0.2).not.toBe(0.02) // the float trap this avoids
    expect(mulDecimal('0.1', 0.2)).toBe('0.02')
    expect(mulDecimal('0.3', '3')).toBe('0.9')
    expect(mulDecimal('1.25', 47.12)).toBe('58.9')
    expect(mulDecimal('-2', '0.5')).toBe('-1')
    expect(mulDecimal('0', 47.12)).toBe('0')
  })

  it('keeps every digit of large values', () => {
    expect(mulDecimal('123456789012345678.123456789', '47.12')).toBe('5817283898261728353.17728389768')
    expect(mulDecimal('42000000000000000000000000', 3.41)).toBe('143220000000000000000000000')
  })

  it('normalises numbers and rejects garbage', () => {
    expect(toDecimalString(1e-7)).toBe('0.0000001')
    expect(toDecimalString(1e21)).toBe('1000000000000000000000')
    expect(toDecimalString('1,234.5')).toBe('1234.5')
    expect(toDecimalString(Number.NaN)).toBeNull()
    expect(toDecimalString('abc')).toBeNull()
    expect(mulDecimal('1', Infinity)).toBeNull()
  })

  it('fiatValue handles in-progress input', () => {
    expect(fiatValue('', 47.12)).toBeNull()
    expect(fiatValue('.', 47.12)).toBeNull()
    expect(fiatValue('2.', 47.12)).toBe('94.24')
    expect(fiatValue('.5', '2')).toBe('1')
    expect(fiatValue('1', undefined)).toBeNull()
  })

  it('formats decimal strings as currency', () => {
    expect(formatFiatDecimal('1234.5678')).toBe('$1,234.57')
    expect(formatFiatDecimal('0.02')).toBe('$0.02')
    expect(formatFiatDecimal('0.001234')).toBe('$0.0012')
    expect(formatFiatDecimal('0')).toBe('$0.00')
    expect(formatFiatDecimal('5817283898261728353.17728389768')).toBe('$5,817,283,898,261,728,353.18')
    expect(formatFiatDecimal('1234.5', 'EUR', 'de-DE')).toMatch(/^1\.234,50\s€$/)
  })
})

describe('percentOf', () => {
  it('floors to base units and never exceeds the balance', () => {
    expect(percentOf(250000000n, 25)).toBe(62500000n)
    expect(percentOf(250000000n, 50)).toBe(125000000n)
    expect(percentOf(3n, 50)).toBe(1n)
    expect(percentOf(999n, 33.33)).toBe(332n)
    expect(percentOf(250000000n, 100)).toBe(250000000n)
    expect(percentOf(250000000n, 0)).toBe(0n)
  })

  it('round-trips through formatUnits exactly for 24-decimal tokens', () => {
    const bal = 42n * 10n ** 24n + 1n
    expect(formatUnits(percentOf(bal, 75), 24)).toBe('31.5')
    expect(formatUnits(percentOf(bal, 100), 24)).toBe('42.000000000000000000000001')
  })
})
