// Fixed-point amounts. Values travel as bigint base units (ZEC → zatoshi, 8 decimals); typing keeps a decimal string.
// Never parseFloat a balance. The only floats here are fiat/percent display helpers that take plain numbers.

export const ZEC_DECIMALS = 8
export const ZATOSHI_PER_ZEC = 100000000n

type Units = bigint | string | number

function toBig(value: Units): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) throw new TypeError('Base-unit amounts must be integers')
    return BigInt(value)
  }
  if (!/^-?\d+$/.test(value.trim())) throw new TypeError(`Not an integer base-unit string: ${value}`)
  return BigInt(value.trim())
}

/** bigint/integer string → exact decimal string, trailing zeros removed. 123450000n, 8 → "1.2345". */
export function formatUnits(value: Units, decimals: number): string {
  const v = toBig(value)
  const neg = v < 0n
  const abs = neg ? -v : v
  if (decimals === 0) return `${neg ? '-' : ''}${abs}`
  const base = 10n ** BigInt(decimals)
  const whole = abs / base
  const frac = (abs % base).toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${neg ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`
}

/** Decimal string → bigint base units. Strips `, _` and spaces. Throws on invalid input or too many decimals. */
export function parseUnits(input: string, decimals: number): bigint {
  const s = input.replace(/[,_\s]/g, '')
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) throw new Error(`Invalid amount: "${input}"`)
  const neg = s.startsWith('-')
  const body = neg ? s.slice(1) : s
  const [whole = '', frac = ''] = body.split('.')
  if (frac.length > decimals) throw new Error(`Too many decimals: max ${decimals}`)
  const v = BigInt((whole || '0') + frac.padEnd(decimals, '0'))
  return neg ? -v : v
}

/** parseUnits that returns null instead of throwing (live validation). */
export function tryParseUnits(input: string, decimals: number): bigint | null {
  try {
    return parseUnits(input, decimals)
  } catch {
    return null
  }
}

/**
 * Clean a raw keystroke string: comma → dot, drop non-digits, keep the first dot only,
 * cut extra decimals, strip redundant leading zeros ("007" → "7", "0.5" stays).
 */
export function sanitizeAmountInput(raw: string, decimals: number): string {
  let s = raw.replace(/,/g, '.').replace(/[^\d.]/g, '')
  const dot = s.indexOf('.')
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '')
  if (decimals === 0) s = s.replace(/\..*$/, '')
  else if (dot !== -1) {
    const [w, f] = s.split('.')
    s = `${w}.${f.slice(0, decimals)}`
  }
  while (/^0\d/.test(s)) s = s.slice(1)
  return s
}

export interface FormatAmountOptions {
  decimals?: number
  /** Full precision (confirmation pages / receipts). */
  exact?: boolean
  /** Display decimals when not exact (default 4). */
  maxDecimals?: number
  /** Use 1.2K / 3.4M when the integer part has more than 4 digits. */
  compact?: boolean
  locale?: string
}

function group(intStr: string, locale?: string): string {
  try {
    return BigInt(intStr).toLocaleString(locale ?? 'en-US')
  } catch {
    return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
}

/** Grouped display. Default ≤ 4 decimals; non-zero values below that show "<0.0001", never "0". */
export function formatAmount(value: Units, opts: FormatAmountOptions = {}): string {
  const decimals = opts.decimals ?? ZEC_DECIMALS
  const maxDecimals = opts.maxDecimals ?? 4
  const v = toBig(value)
  const neg = v < 0n
  const abs = neg ? -v : v
  const base = 10n ** BigInt(decimals)
  const whole = abs / base
  const sign = neg ? '-' : ''

  if (opts.compact && whole >= 10000n) {
    return sign + formatCompact(Number(formatUnits(abs, decimals)), opts.locale)
  }
  if (opts.exact) {
    const [w, f] = formatUnits(abs, decimals).split('.')
    return `${sign}${group(w, opts.locale)}${f ? `.${f}` : ''}`
  }
  const shown = Math.min(maxDecimals, decimals)
  const scale = 10n ** BigInt(decimals - shown)
  const truncated = abs / scale // floor: never round a balance up
  if (abs !== 0n && truncated === 0n) {
    const floor = `0.${'0'.repeat(Math.max(0, shown - 1))}1`
    return neg ? `>-${floor}` : `<${floor}`
  }
  const w = truncated / 10n ** BigInt(shown)
  const f = shown > 0 ? (truncated % 10n ** BigInt(shown)).toString().padStart(shown, '0').replace(/0+$/, '') : ''
  return `${sign}${group(w.toString(), opts.locale)}${f ? `.${f}` : ''}`
}

/** "<$0.01" values get 4 decimals, everything else 2. */
export function formatFiat(n: number, currency = 'USD', locale = 'en-US'): string {
  const small = n !== 0 && Math.abs(n) < 0.01
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: small ? 4 : 2,
    maximumFractionDigits: small ? 4 : 2,
  }).format(n)
}

/** Percent units in (12.5 → "12.50%"). */
export function formatPercent(n: number, digits = 2, locale = 'en-US', signed = false): string {
  const s = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
  return `${signed && n > 0 ? '+' : ''}${s}%`
}

export function formatCompact(n: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
