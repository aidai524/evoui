// Shielded memos: 512 UTF-8 bytes max; truncation never splits a multi-byte character.

export const MEMO_MAX_BYTES = 512

const enc = new TextEncoder()

export function memoByteLength(text: string): number {
  return enc.encode(text).length
}

export function isMemoValid(text: string, maxBytes = MEMO_MAX_BYTES): boolean {
  return memoByteLength(text) <= maxBytes
}

/** Cut at a character boundary so the UTF-8 encoding fits maxBytes. */
export function truncateMemo(text: string, maxBytes = MEMO_MAX_BYTES): string {
  if (memoByteLength(text) <= maxBytes) return text
  let out = ''
  let used = 0
  for (const ch of text) {
    const n = enc.encode(ch).length
    if (used + n > maxBytes) break
    out += ch
    used += n
  }
  return out
}

/** base64url without padding (ZIP-321 memo encoding). */
export function encodeMemoBase64Url(text: string): string {
  const bytes = enc.encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
