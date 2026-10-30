// Linear bonding curve: price(x) = p0 + (p1 − p0) · x / s, in payment atoms per whole unit.
// The UI only uses spotPrice / marketCap for display. Buy amounts are never previewed
// in the UI (the integral lives in the contract); costOf/unitsFor exist for the fake backend.

export interface CurveParams {
  s: bigint
  p0: bigint
  p1: bigint
}

export function spotPrice(c: CurveParams, sold: bigint): bigint {
  if (c.s === 0n) return c.p0
  return c.p0 + ((c.p1 - c.p0) * sold) / c.s
}

/** Cost of buying n units starting at x sold (ceil, so the curve never under-charges). */
export function costOf(c: CurveParams, x: bigint, n: bigint): bigint {
  const twoS = 2n * c.s
  const num = n * c.p0 * twoS + (c.p1 - c.p0) * (2n * x * n + n * n)
  return (num + twoS - 1n) / twoS
}

/** Proceeds of selling n units back from x sold (floor). */
export function proceedsOf(c: CurveParams, x: bigint, n: bigint): bigint {
  const twoS = 2n * c.s
  const start = x - n
  const num = n * c.p0 * twoS + (c.p1 - c.p0) * (2n * start * n + n * n)
  return num / twoS
}

/** Largest n ≤ s − x with costOf(x, n) ≤ budget. */
export function unitsFor(c: CurveParams, x: bigint, budget: bigint): bigint {
  let lo = 0n
  let hi = c.s - x
  while (lo < hi) {
    const mid = (lo + hi + 1n) / 2n
    if (costOf(c, x, mid) <= budget) lo = mid
    else hi = mid - 1n
  }
  return lo
}

export function curveParams(v: { s: string; p0: string; p1: string }): CurveParams {
  return { s: BigInt(v.s), p0: BigInt(v.p0), p1: BigInt(v.p1) }
}
