// Zcash address parsing for UX only. Wallet SDK / node validation is always authoritative.

export type AddressKind = 'unified' | 'sapling' | 'transparent' | 'tex' | 'sprout'
export type Network = 'main' | 'test'

export interface ParsedAddress {
  kind: AddressKind
  network: Network
  shielded: boolean
  /** true/false when a checksum was verified; null when not checkable (base58 transparent / sprout). */
  checksum: boolean | null
}

export const ADDRESS_KIND_LABEL: Record<AddressKind, string> = {
  unified: 'Unified',
  sapling: 'Sapling',
  transparent: 'Transparent',
  tex: 'TEX',
  sprout: 'Sprout',
}

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
const BECH32_CONST = 1
const BECH32M_CONST = 0x2bc830a3

function polymod(values: number[]): number {
  let chk = 1
  for (const v of values) {
    const top = chk >>> 25
    chk = ((chk & 0x1ffffff) << 5) ^ v
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) chk ^= GEN[i]
  }
  return chk >>> 0
}

function hrpExpand(hrp: string): number[] {
  const out: number[] = []
  for (const c of hrp) out.push(c.charCodeAt(0) >> 5)
  out.push(0)
  for (const c of hrp) out.push(c.charCodeAt(0) & 31)
  return out
}

/**
 * Verify a bech32 / bech32m string. No 90-character limit (Unified addresses are longer).
 * Mixed case is invalid. Returns the hrp on success, null otherwise.
 */
export function verifyBech32(addr: string, variant: 'bech32' | 'bech32m'): string | null {
  if (addr !== addr.toLowerCase() && addr !== addr.toUpperCase()) return null
  const s = addr.toLowerCase()
  const sep = s.lastIndexOf('1')
  if (sep < 1 || sep + 7 > s.length) return null
  const hrp = s.slice(0, sep)
  const data: number[] = []
  for (const c of s.slice(sep + 1)) {
    const d = CHARSET.indexOf(c)
    if (d === -1) return null
    data.push(d)
  }
  const want = variant === 'bech32' ? BECH32_CONST : BECH32M_CONST
  return polymod([...hrpExpand(hrp), ...data]) === want ? hrp : null
}

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/

/** Returns kind/network/shielded/checksum, or null when the string is not a recognisable Zcash address. */
export function parseAddress(input: string): ParsedAddress | null {
  const a = input.trim()
  if (!a) return null
  const lower = a.toLowerCase()

  const bech = (prefixes: Record<string, Network>, variant: 'bech32' | 'bech32m', kind: AddressKind, shielded: boolean): ParsedAddress | null => {
    for (const [hrp, network] of Object.entries(prefixes)) {
      if (lower.startsWith(hrp + '1')) {
        const ok = verifyBech32(a, variant) === hrp
        return { kind, network, shielded, checksum: ok }
      }
    }
    return null
  }

  return (
    bech({ utest: 'test', u: 'main' }, 'bech32m', 'unified', true) ??
    bech({ ztestsapling: 'test', zs: 'main' }, 'bech32', 'sapling', true) ??
    bech({ textest: 'test', tex: 'main' }, 'bech32m', 'tex', false) ??
    (BASE58.test(a) && /^(t1|t3)/.test(a) && a.length === 35 ? { kind: 'transparent', network: 'main', shielded: false, checksum: null } : null) ??
    (BASE58.test(a) && /^(tm|t2)/.test(a) && a.length === 35 ? { kind: 'transparent', network: 'test', shielded: false, checksum: null } : null) ??
    (BASE58.test(a) && /^(zc|zt)/.test(a) && a.length === 95
      ? { kind: 'sprout', network: a.startsWith('zc') ? 'main' : 'test', shielded: true, checksum: null }
      : null)
  )
}

/** Format + checksum (when checkable) + network match; deprecated Sprout is rejected. */
export function isValidAddress(addr: string, network?: Network): boolean {
  const p = parseAddress(addr)
  if (!p || p.kind === 'sprout') return false
  if (p.checksum === false) return false
  if (network && p.network !== network) return false
  return true
}

export function isShieldedAddress(addr: string): boolean {
  return parseAddress(addr)?.shielded ?? false
}

export function addressKind(addr: string): AddressKind | null {
  return parseAddress(addr)?.kind ?? null
}

/** "u1abcdefg…uvwxyz"; returns the input unchanged when it is short enough. */
export function truncateMiddle(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

/** Build a valid bech32/bech32m string from an hrp and 5-bit words (sample data + tests). */
export function encodeBech32(hrp: string, words: number[], variant: 'bech32' | 'bech32m'): string {
  const values = [...hrpExpand(hrp), ...words, 0, 0, 0, 0, 0, 0]
  const mod = polymod(values) ^ (variant === 'bech32' ? BECH32_CONST : BECH32M_CONST)
  const checksum = Array.from({ length: 6 }, (_, i) => (mod >>> (5 * (5 - i))) & 31)
  return `${hrp}1${[...words, ...checksum].map((w) => CHARSET[w]).join('')}`
}
