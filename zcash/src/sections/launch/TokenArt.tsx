// Cover art for featured cards. A real cover (token.cover) wins; otherwise a deterministic geometric
// composition seeded by the symbol, drawn with theme variables so it follows the palette.

import type { CSSProperties } from 'react'
import type { TokenInfo } from '../../lib/types'

const isImage = (u: string | null | undefined): u is string => !!u && /^(https?:|data:image\/|\/(?!\/))/.test(u)

/** FNV-1a → small deterministic PRNG. */
function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  let x = h >>> 0
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return ((x >>> 0) % 10000) / 10000
  }
}

const fill = (v: string): CSSProperties => ({ fill: `var(${v})` })
const stroke = (v: string, w = 1): CSSProperties => ({ fill: 'none', stroke: `var(${v})`, strokeWidth: w })

const W = 400
const H = 240

function Orbit({ r }: { r: () => number }) {
  const cx = 120 + r() * 160
  const cy = 60 + r() * 120
  const rings = 5 + Math.floor(r() * 4)
  return (
    <>
      {Array.from({ length: rings }, (_, i) => (
        <circle key={i} cx={cx} cy={cy} r={18 + i * 26} style={stroke(i === 2 ? '--accent' : '--line-strong', i === 2 ? 3 : 1)} />
      ))}
      <circle cx={cx} cy={cy} r={18} style={fill('--accent')} />
      <circle cx={cx + 70 * Math.cos(r() * 6.28)} cy={cy + 70 * Math.sin(r() * 6.28)} r={7} style={fill('--lime')} />
    </>
  )
}

function Stripes({ r }: { r: () => number }) {
  const n = 9 + Math.floor(r() * 6)
  const off = r() * 60
  return (
    <>
      <g transform={`rotate(${-30 - r() * 20} ${W / 2} ${H / 2})`}>
        {Array.from({ length: n }, (_, i) => {
          const w = 4 + Math.floor(r() * 3) * 6
          return <rect key={i} x={-120 + off + i * 52} y={-200} width={w} height={H + 400} style={fill(i % 4 === 1 ? '--accent' : '--line-strong')} />
        })}
      </g>
      <rect x={40 + r() * 220} y={40 + r() * 80} width={72} height={72} style={fill('--bg')} />
      <rect x={40 + r() * 220} y={40 + r() * 80} width={36} height={36} style={fill('--accent')} />
    </>
  )
}

function Blocks({ r }: { r: () => number }) {
  const size = 40
  const cells: { x: number; y: number; k: number }[] = []
  for (let y = 0; y < H; y += size) for (let x = 0; x < W; x += size) cells.push({ x, y, k: r() })
  return (
    <>
      {cells.map((c, i) =>
        c.k > 0.86 ? (
          <rect key={i} x={c.x} y={c.y} width={size} height={size} style={fill('--accent')} />
        ) : c.k > 0.8 ? (
          <rect key={i} x={c.x} y={c.y} width={size} height={size} style={fill('--lime')} />
        ) : c.k > 0.55 ? (
          <rect key={i} x={c.x + 0.5} y={c.y + 0.5} width={size - 1} height={size - 1} style={stroke('--line-strong')} />
        ) : c.k > 0.5 ? (
          <circle key={i} cx={c.x + size / 2} cy={c.y + size / 2} r={6} style={fill('--accent-deep')} />
        ) : null,
      )}
    </>
  )
}

function Skyline({ r }: { r: () => number }) {
  const bars = 14
  const bw = W / bars
  return (
    <>
      {Array.from({ length: bars }, (_, i) => {
        const h = 30 + r() * (H - 70)
        const hot = r() > 0.78
        return <rect key={i} x={i * bw + 3} y={H - h} width={bw - 6} height={h} style={fill(hot ? '--accent' : '--line-strong')} />
      })}
      <line x1={0} y1={60 + r() * 40} x2={W} y2={20 + r() * 40} style={stroke('--lime', 2)} />
    </>
  )
}

const PATTERNS = [Orbit, Stripes, Blocks, Skyline]

/** Pattern index the symbol hashes to (callers can pass `pattern` to keep a row of covers distinct). */
export function artPattern(symbol: string): number {
  return Math.floor(rng(symbol)() * PATTERNS.length)
}
export const ART_PATTERNS = PATTERNS.length

export function TokenArt({ token, className, pattern }: { token: TokenInfo; className?: string; pattern?: number }) {
  if (isImage(token.cover)) {
    return (
      <div className={`token-art ${className ?? ''}`}>
        <img src={token.cover} alt="" loading="lazy" />
      </div>
    )
  }
  const r = rng(token.symbol)
  const hashed = Math.floor(r() * PATTERNS.length)
  const Pattern = PATTERNS[(pattern ?? hashed) % PATTERNS.length]
  return (
    <div className={`token-art ${className ?? ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width={W} height={H} style={fill('--surface-2')} />
        <Pattern r={r} />
      </svg>
      {isImage(token.icon) && (
        <span className="token-art-icon">
          <img src={token.icon} alt="" />
        </span>
      )}
    </div>
  )
}
