// Exact decimal ⇄ atom conversion on bigint. No floats touch amounts that get signed.

export function toAtoms(input: string, decimals: number): bigint | null {
  const s = input.trim()
  if (!/^\d*(\.\d*)?$/.test(s) || s === '' || s === '.') return null
  const [whole, frac = ''] = s.split('.')
  if (frac.length > decimals) return null
  return BigInt((whole || '0') + frac.padEnd(decimals, '0'))
}

export function fromAtoms(atoms: bigint | string, decimals: number, maxFrac = 4): string {
  const v = typeof atoms === 'bigint' ? atoms : BigInt(atoms)
  const neg = v < 0n
  const abs = neg ? -v : v
  const base = 10n ** BigInt(decimals)
  const whole = abs / base
  let frac = (abs % base).toString().padStart(decimals, '0').slice(0, maxFrac).replace(/0+$/, '')
  if (frac === '' && abs !== 0n && whole === 0n) {
    // Tiny non-zero: show the first significant digits instead of 0.
    const full = (abs % base).toString().padStart(decimals, '0')
    const firstSig = full.search(/[1-9]/)
    frac = full.slice(0, Math.min(firstSig + 2, decimals)).replace(/0+$/, '')
  }
  return `${neg ? '-' : ''}${groupInt(whole)}${frac ? '.' + frac : ''}`
}

export function groupInt(v: bigint | string | number): string {
  return BigInt(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Compact: 1.2K, 3.4M … for display only. */
export function compact(v: bigint | string, decimals = 0): string {
  const n = Number(BigInt(v)) / 10 ** decimals
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export function shortHex(h: string, n = 6): string {
  if (h.length <= n * 2 + 1) return h
  return `${h.slice(0, n)}…${h.slice(-n)}`
}

export function shortAccount(id: string, max = 22): string {
  if (id.length <= max) return id
  return `${id.slice(0, max - 10)}…${id.slice(-8)}`
}

export function bpsToPct(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`
}

export function ratioBps(num: bigint, den: bigint): number {
  if (den === 0n) return 0
  return Number((num * 10000n) / den)
}

export function relTime(ms: number): string {
  const d = ms - Date.now()
  const abs = Math.abs(d)
  const m = Math.round(abs / 60000)
  const s = Math.round(abs / 1000)
  const txt = abs < 60000 ? `${s}s` : m < 60 ? `${m}m` : `${Math.round(m / 60)}h`
  return d >= 0 ? `in ${txt}` : `${txt} ago`
}

export function clock(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + 'Z'
}

/** Age since a past timestamp: 45m, 20h, 3d, 5w. */
export function age(ms: number, now = Date.now()): string {
  const m = Math.max(0, Math.floor((now - ms) / 60000))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  const d = Math.floor(h / 24)
  return d < 14 ? `${d}d` : `${Math.floor(d / 7)}w`
}

/** Signed percent from basis points: +12.4%, −3.1%, 0%. */
export function signedPct(bps: number): string {
  if (bps === 0) return '0%'
  const v = Math.abs(bps) / 100
  const txt = v >= 100 ? v.toFixed(0) : v.toFixed(1)
  return `${bps > 0 ? '+' : '−'}${txt}%`
}

/** Display amount from atoms with precision that fits the size: 0.0042, 9.75, 147.4, 12.3K. */
export function amountShort(atoms: bigint | string, decimals: number): string {
  const n = Number(BigInt(atoms)) / 10 ** decimals
  if (!Number.isFinite(n)) return '—'
  const a = Math.abs(n)
  if (a === 0) return '0'
  if (a >= 1e4) return compact(atoms, decimals)
  if (a >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
  if (a >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return n.toPrecision(2).replace(/0+$/, '')
}
