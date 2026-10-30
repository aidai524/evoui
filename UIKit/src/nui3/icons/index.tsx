// Inline SVG icons: fill none, stroke currentColor, 1.4 width, square caps. Decorative by default (aria-hidden).
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base(w: number, h: number, size: number | undefined, props: SVGProps<SVGSVGElement>) {
  const scale = size ? size / Math.max(w, h) : 1
  return {
    width: w * scale,
    height: h * scale,
    viewBox: `0 0 ${w} ${h}`,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'square' as const,
    strokeLinejoin: 'miter' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
    ...props,
  }
}

export const ArrowIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(18, 10, size, p)}>
    <path d="M1 5h15M12 1l4 4-4 4" />
  </svg>
)
export const ExternalIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(12, 12, size, p)}>
    <path d="M4.5 1.5h6v6M10.5 1.5 4 8M8.5 7.5v3h-7v-7h3" />
  </svg>
)
export const CopyIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(14, 14, size, p)}>
    <path d="M4.5 4.5h8v8h-8zM9.5 4.5v-3h-8v8h3" />
  </svg>
)
export const CheckIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(14, 14, size, p)}>
    <path d="M2 7.5 5.5 11 12 3.5" />
  </svg>
)
export const CloseIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(14, 14, size, p)}>
    <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
  </svg>
)
export const SearchIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M7 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM10.5 10.5l3.5 3.5" />
  </svg>
)
export const SwapIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M5 2v11M2 10l3 3 3-3M11 14V3M8 6l3-3 3 3" />
  </svg>
)
export const ShieldIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(12, 12, size, p)}>
    <path d="M6 1 2 2.5V6c0 2.4 1.7 4.2 4 5 2.3-.8 4-2.6 4-5V2.5L6 1z" />
  </svg>
)
export const LockIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(12, 12, size, p)}>
    <path d="M2.5 5.5h7v5h-7zM4 5.5V4a2 2 0 0 1 4 0v1.5" />
  </svg>
)
export const EyeIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 12, size, p)}>
    <path d="M1 6s2.5-4.5 7-4.5S15 6 15 6s-2.5 4.5-7 4.5S1 6 1 6z" />
    <path d="M8 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
)
export const EyeOffIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 12, size, p)}>
    <path d="M1 6s2.5-4.5 7-4.5S15 6 15 6s-2.5 4.5-7 4.5S1 6 1 6zM2 11 14 1" />
  </svg>
)
export const MenuIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(18, 12, size, p)}>
    <path d="M1 1h16M1 6h16M1 11h16" />
  </svg>
)
export const ChevronIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(10, 6, size, p)}>
    <path d="M1 1l4 4 4-4" />
  </svg>
)
export const GlobeIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(14, 14, size, p)}>
    <path d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1zM1 7h12M7 1c-2 2.3-2 9.7 0 12M7 1c2 2.3 2 9.7 0 12" />
  </svg>
)
