// ZIP-321 payment URIs, RFC 4180 CSV, and batch payment validation.
import { isShieldedAddress, isValidAddress, type Network } from './address'
import { tryParseUnits, ZEC_DECIMALS } from './amount'
import { encodeMemoBase64Url, MEMO_MAX_BYTES, memoByteLength } from './memo'

export interface PaymentRequest {
  address: string
  /** Decimal ZEC string, ≤ 8 decimals. */
  amount?: string
  memo?: string
  label?: string
  message?: string
}

const AMOUNT_RE = /^\d{1,8}(\.\d{1,8})?$/

/** Single: zcash:<addr>?amount=…&memo=…  Multi: zcash:?address=…&amount=…&address.1=… */
export function buildPaymentUri(req: PaymentRequest | PaymentRequest[]): string {
  const list = Array.isArray(req) ? req : [req]
  if (list.length === 0) throw new Error('At least one payment is required')
  const params = (r: PaymentRequest, i: number, includeAddress: boolean): string[] => {
    if (!isValidAddress(r.address)) throw new Error(`Invalid address: ${r.address}`)
    const sfx = i === 0 ? '' : `.${i}`
    const out: string[] = []
    if (includeAddress) out.push(`address${sfx}=${r.address}`)
    if (r.amount != null) {
      if (!AMOUNT_RE.test(r.amount)) throw new Error(`Invalid amount: ${r.amount}`)
      out.push(`amount${sfx}=${r.amount}`)
    }
    if (r.memo) {
      if (!isShieldedAddress(r.address)) throw new Error('Memos can only be sent to shielded addresses')
      if (memoByteLength(r.memo) > MEMO_MAX_BYTES) throw new Error('Memo over 512 bytes')
      out.push(`memo${sfx}=${encodeMemoBase64Url(r.memo)}`)
    }
    if (r.label) out.push(`label${sfx}=${encodeURIComponent(r.label)}`)
    if (r.message) out.push(`message${sfx}=${encodeURIComponent(r.message)}`)
    return out
  }
  if (list.length === 1) {
    const q = params(list[0], 0, false)
    return `zcash:${list[0].address}${q.length ? `?${q.join('&')}` : ''}`
  }
  return `zcash:?${list.flatMap((r, i) => params(r, i, true)).join('&')}`
}

/** RFC 4180: quotes, escaped quotes, commas and newlines inside quotes. Fully empty rows are dropped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
      continue
    }
    if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  row.push(field)
  rows.push(row)
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

export interface PaymentRow {
  /** 1-based source line (after the header when present). */
  line: number
  name?: string
  address: string
  amount: string
  memo?: string
}

const HEADERS: Record<'name' | 'address' | 'amount' | 'memo', string[]> = {
  name: ['name', 'recipient', 'employee', '姓名', '收款人'],
  address: ['address', 'addr', 'wallet', '地址'],
  amount: ['amount', 'zec', 'value', '金额'],
  memo: ['memo', 'note', 'reference', '备注'],
}

/** Header (any order, case-insensitive, en/zh aliases) or headerless `address,amount[,memo]`. Strips BOM. */
export function parsePaymentCsv(text: string): PaymentRow[] {
  const rows = parseCsv(text)
  if (rows.length === 0) return []
  const head = rows[0].map((h) => h.trim().toLowerCase())
  const col = (k: keyof typeof HEADERS) => head.findIndex((h) => HEADERS[k].includes(h))
  const hasHeader = col('address') !== -1
  if (hasHeader) {
    const idx = { name: col('name'), address: col('address'), amount: col('amount'), memo: col('memo') }
    return rows.slice(1).map((r, i) => ({
      line: i + 2,
      name: idx.name >= 0 ? r[idx.name]?.trim() || undefined : undefined,
      address: (r[idx.address] ?? '').trim(),
      amount: idx.amount >= 0 ? (r[idx.amount] ?? '').trim() : '',
      memo: idx.memo >= 0 ? r[idx.memo]?.trim() || undefined : undefined,
    }))
  }
  return rows.map((r, i) => ({
    line: i + 1,
    address: (r[0] ?? '').trim(),
    amount: (r[1] ?? '').trim(),
    memo: r[2]?.trim() || undefined,
  }))
}

export type PaymentIssue = 'address' | 'amount' | 'memoNotAllowed' | 'memoTooLong' | 'duplicate'

export interface ValidatedPayment {
  line: number
  issues: PaymentIssue[]
  units: bigint | null
  shielded: boolean
}

export interface PaymentValidation {
  rows: ValidatedPayment[]
  total: bigint
  valid: number
  invalid: number
}

export function validatePayments(rows: PaymentRow[], opts: { decimals?: number; network?: Network } = {}): PaymentValidation {
  const decimals = opts.decimals ?? ZEC_DECIMALS
  const seen = new Map<string, number>()
  for (const r of rows) seen.set(r.address, (seen.get(r.address) ?? 0) + 1)
  let total = 0n
  let valid = 0
  const out = rows.map((r) => {
    const issues: PaymentIssue[] = []
    if (!isValidAddress(r.address, opts.network)) issues.push('address')
    const units = tryParseUnits(r.amount, decimals)
    if (units == null || units <= 0n) issues.push('amount')
    const shielded = isShieldedAddress(r.address)
    if (r.memo) {
      if (!shielded) issues.push('memoNotAllowed')
      if (memoByteLength(r.memo) > MEMO_MAX_BYTES) issues.push('memoTooLong')
    }
    if ((seen.get(r.address) ?? 0) > 1) issues.push('duplicate')
    if (issues.length === 0) {
      valid++
      total += units!
    }
    return { line: r.line, issues, units: units != null && units > 0n ? units : null, shielded }
  })
  return { rows: out, total, valid, invalid: rows.length - valid }
}
