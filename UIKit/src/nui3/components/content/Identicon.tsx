import { useMemo, type SVGAttributes } from 'react'
import { cx } from '../../utils/cx'

export interface IdenticonProps extends Omit<SVGAttributes<SVGSVGElement>, 'values'> {
  /** Any string (address, collection id, token id). Same value → same image. */
  value: string
  /** Pixel size (default 32). Use `'100%'` to fill the parent (NFT placeholder). */
  size?: number | string
  /** `grid`: round 5×5 mirrored identicon. `art`: square abstract composition (NFT placeholder). */
  variant?: 'grid' | 'art'
  /** When given: role="img" + aria-label. Otherwise decorative (aria-hidden). */
  label?: string
}

/** FNV-1a 32-bit. */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 PRNG seeded from the hash. */
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const chart = (n: number) => `var(--nui-chart-${(n % 5) + 1})`

export function Identicon({ value, size = 32, variant = 'grid', label, className, ...rest }: IdenticonProps) {
  const shapes = useMemo(() => {
    const r = rng(hash(`${variant}:${value}`))
    if (variant === 'grid') {
      const fg = chart(Math.floor(r() * 3))
      const cells: [number, number][] = []
      for (let y = 0; y < 5; y++)
        for (let x = 0; x < 3; x++)
          if (r() > 0.5) {
            cells.push([x, y])
            if (x < 2) cells.push([4 - x, y])
          }
      if (!cells.length) cells.push([2, 2])
      return (
        <>
          <rect width="7" height="7" style={{ fill: `color-mix(in srgb, ${fg} 14%, var(--nui-surface))` }} />
          {cells.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width="1.02" height="1.02" style={{ fill: fg }} />
          ))}
        </>
      )
    }
    const c0 = Math.floor(r() * 5)
    const bg = `color-mix(in srgb, ${chart(c0)} 14%, var(--nui-surface-sunken))`
    const cx1 = 20 + r() * 60
    const cy1 = 20 + r() * 60
    const rad = 18 + r() * 22
    const rot = Math.floor(r() * 8) * 45
    const stripes = 2 + Math.floor(r() * 4)
    const tri = [r() * 100, r() * 100, r() * 100, 100, 100, r() * 100]
    return (
      <>
        <rect width="100" height="100" style={{ fill: bg }} />
        {Array.from({ length: stripes }, (_, i) => (
          <rect key={i} x="0" y={100 - (i + 1) * 9} width="100" height="3" style={{ fill: chart(c0 + 3), opacity: 0.35 }} />
        ))}
        <polygon points={tri.join(' ')} style={{ fill: chart(c0 + 1), opacity: 0.55 }} />
        <circle cx={cx1} cy={cy1} r={rad} style={{ fill: chart(c0) }} />
        <rect x="38" y="38" width="24" height="24" transform={`rotate(${rot} 50 50)`} style={{ fill: 'none', stroke: chart(c0 + 2), strokeWidth: 3 }} />
      </>
    )
  }, [value, variant])

  const box = variant === 'grid' ? '0 0 7 7' : '0 0 100 100'
  return (
    <svg
      className={cx('nui-identicon', `nui-identicon--${variant}`, className)}
      width={size}
      height={size}
      viewBox={box}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering={variant === 'grid' ? 'crispEdges' : undefined}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...rest}
    >
      {shapes}
    </svg>
  )
}
