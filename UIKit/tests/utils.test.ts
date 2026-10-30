import { describe, expect, it } from 'vitest'
import {
  buildPaymentUri,
  encodeBech32,
  formatAmount,
  formatUnits,
  isValidAddress,
  memoByteLength,
  niceTicks,
  paginationRange,
  parseAddress,
  parseCsv,
  parsePaymentCsv,
  parseUnits,
  sanitizeAmountInput,
  truncateMemo,
  truncateMiddle,
  tryParseUnits,
  validatePayments,
} from '../src/nui3/utils'

const words = (n: number, seed = 7) => Array.from({ length: n }, (_, i) => (i * seed + 3) % 32)
const UA = encodeBech32('u', words(140), 'bech32m')
const SAPLING = encodeBech32('zs', words(70, 11), 'bech32')
const TEX = encodeBech32('tex', words(33, 5), 'bech32m')
const T1 = 't1Rv4exT7bqhZqi2j7xz8bUHDMxwosrjADU'

describe('amount', () => {
  it('formatUnits / parseUnits round-trip exactly', () => {
    expect(formatUnits(123450000n, 8)).toBe('1.2345')
    expect(formatUnits(0n, 8)).toBe('0')
    expect(formatUnits(-50n, 2)).toBe('-0.5')
    expect(parseUnits('1,234.5', 8)).toBe(123450000000n)
    expect(parseUnits('.5', 8)).toBe(50000000n)
    expect(() => parseUnits('1.123456789', 8)).toThrow()
    expect(() => parseUnits('abc', 8)).toThrow()
    expect(tryParseUnits('x', 8)).toBeNull()
  })

  it('sanitizeAmountInput keeps one dot, cuts decimals, drops leading zeros', () => {
    expect(sanitizeAmountInput('00012,345678912', 8)).toBe('12.34567891')
    expect(sanitizeAmountInput('1.2.3', 8)).toBe('1.23')
    expect(sanitizeAmountInput('0.5', 8)).toBe('0.5')
    expect(sanitizeAmountInput('abc7', 8)).toBe('7')
  })

  it('formatAmount groups, caps 4 decimals, never shows 0 for dust', () => {
    expect(formatAmount(123456789012n)).toBe('1,234.5678')
    expect(formatAmount(1n)).toBe('<0.0001')
    expect(formatAmount(-1n)).toBe('>-0.0001')
    expect(formatAmount(0n)).toBe('0')
    expect(formatAmount(123456789n, { exact: true })).toBe('1.23456789')
    expect(formatAmount(1234567n * 10n ** 8n, { compact: true })).toBe('1.2M')
  })
})

describe('address', () => {
  it('recognises kinds and verifies checksums', () => {
    expect(parseAddress(UA)).toMatchObject({ kind: 'unified', network: 'main', shielded: true, checksum: true })
    expect(parseAddress(SAPLING)).toMatchObject({ kind: 'sapling', shielded: true, checksum: true })
    expect(parseAddress(TEX)).toMatchObject({ kind: 'tex', shielded: false, checksum: true })
    expect(parseAddress(T1)).toMatchObject({ kind: 'transparent', checksum: null })
    const broken = UA.slice(0, -1) + (UA.endsWith('q') ? 'p' : 'q')
    expect(isValidAddress(broken)).toBe(false)
    const mixed = UA.slice(0, 5) + UA.slice(5, 6).toUpperCase() + UA.slice(6)
    expect(isValidAddress(mixed)).toBe(mixed === UA)
    expect(isValidAddress(UA, 'test')).toBe(false)
    expect(isValidAddress('zc' + 'a'.repeat(93))).toBe(false)
  })

  it('truncateMiddle', () => {
    expect(truncateMiddle('u1abcdefghijklmnopqrstuvwxyz')).toBe('u1abcdef…uvwxyz')
    expect(truncateMiddle('short')).toBe('short')
  })
})

describe('memo + zip321', () => {
  it('counts UTF-8 bytes and truncates on character boundaries', () => {
    expect(memoByteLength('隐私')).toBe(6)
    expect(truncateMemo('é'.repeat(300), 512)).toHaveLength(256)
    expect(truncateMemo('ab隐', 4)).toBe('ab')
  })

  it('builds single and multi recipient URIs', () => {
    expect(buildPaymentUri({ address: UA, amount: '1.5', memo: 'hi' })).toBe(`zcash:${UA}?amount=1.5&memo=aGk`)
    expect(buildPaymentUri([{ address: UA, amount: '1' }, { address: T1, amount: '2' }])).toBe(`zcash:?address=${UA}&amount=1&address.1=${T1}&amount.1=2`)
    expect(() => buildPaymentUri({ address: T1, memo: 'x' })).toThrow(/shielded/)
    expect(() => buildPaymentUri({ address: UA, amount: '1.123456789' })).toThrow()
  })
})

describe('csv + batch payments', () => {
  it('parses RFC 4180 quoting', () => {
    expect(parseCsv('a,"b,c","d ""q"""\n\n"x\ny",z')).toEqual([
      ['a', 'b,c', 'd "q"'],
      ['x\ny', 'z'],
    ])
  })

  it('maps headers in any order and validates rows', () => {
    const csv = `﻿金额,地址,姓名,备注\n1.5,${UA},Ana,thanks\n2,${T1},Bo,nope\n0,${SAPLING},Cy,\nx,${UA},Dee,`
    const rows = parsePaymentCsv(csv)
    expect(rows[0]).toMatchObject({ line: 2, name: 'Ana', address: UA, amount: '1.5', memo: 'thanks' })
    const v = validatePayments(rows)
    expect(v.rows[0].issues).toEqual(['duplicate'])
    expect(v.rows[1].issues).toEqual(['memoNotAllowed'])
    expect(v.rows[2].issues).toEqual(['amount'])
    expect(v.rows[3].issues).toEqual(['amount', 'duplicate'])
    expect(v.valid).toBe(0)
    expect(parsePaymentCsv(`${UA},1\n${T1},2,x`)).toHaveLength(2)
  })
})

describe('ticks + pagination', () => {
  it('niceTicks covers range with round steps', () => {
    expect(niceTicks(0, 97, 4)).toEqual([0, 20, 40, 60, 80, 100])
  })
  it('paginationRange', () => {
    expect(paginationRange(5, 20, 1)).toEqual([1, 'gap', 4, 5, 6, 'gap', 20])
    expect(paginationRange(1, 20, 1)).toEqual([1, 2, 3, 4, 5, 'gap', 20])
    expect(paginationRange(3, 5, 1)).toEqual([1, 2, 3, 4, 5])
  })
})
