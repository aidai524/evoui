// Chart ticks, pagination ranges, privacy metadata, disclaimer.

/** Round axis ticks covering [min, max] with ~count steps (1/2/5 × 10^n). */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return []
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1
    min -= pad
    max += pad
  }
  if (min > max) [min, max] = [max, min]
  const raw = (max - min) / Math.max(1, count)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  // Nearest of 1/2/5/10 in log space (d3 thresholds √2, √10, √50).
  const step = (norm < Math.SQRT2 ? 1 : norm < Math.sqrt(10) ? 2 : norm < Math.sqrt(50) ? 5 : 10) * mag
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const out: number[] = []
  for (let v = start; v <= end + step / 2; v += step) out.push(Number(v.toPrecision(12)))
  return out
}

export type PageItem = number | 'gap'

/** 1 … 4 5 6 … 20 (siblings = 1). */
export function paginationRange(page: number, pages: number, siblings = 1): PageItem[] {
  if (pages <= 0) return []
  const total = siblings * 2 + 5
  if (pages <= total) return Array.from({ length: pages }, (_, i) => i + 1)
  const left = Math.max(page - siblings, 1)
  const right = Math.min(page + siblings, pages)
  const showLeftGap = left > 3
  const showRightGap = right < pages - 2
  if (!showLeftGap) {
    const n = 3 + 2 * siblings
    return [...Array.from({ length: n }, (_, i) => i + 1), 'gap', pages]
  }
  if (!showRightGap) {
    const n = 3 + 2 * siblings
    return [1, 'gap', ...Array.from({ length: n }, (_, i) => pages - n + i + 1)]
  }
  return [1, 'gap', ...Array.from({ length: right - left + 1 }, (_, i) => left + i), 'gap', pages]
}

export type PrivacyLevel = 'shielded' | 'confidential' | 'public'

export const PRIVACY_LEVELS: Record<PrivacyLevel, { label: string; description: string; labelKey: string; descriptionKey: string }> = {
  shielded: {
    label: 'Shielded',
    description: 'Zcash shielded pool. Sender, recipient and amount are encrypted on-chain.',
    labelKey: 'privacyShielded',
    descriptionKey: 'privacyShieldedDesc',
  },
  confidential: {
    label: 'Confidential',
    description:
      'Confidential execution. Balances and positions are hidden from the public, but are processed by the execution environment and are not protected by Zcash shielded cryptography.',
    labelKey: 'privacyConfidential',
    descriptionKey: 'privacyConfidentialDesc',
  },
  public: {
    label: 'Public',
    description: 'Public chain or external protocol. Addresses, amounts and history are visible to anyone.',
    labelKey: 'privacyPublic',
    descriptionKey: 'privacyPublicDesc',
  },
}

export const DEFAULT_DISCLAIMER = 'Not affiliated with the Zcash Foundation or Electric Coin Company.'
