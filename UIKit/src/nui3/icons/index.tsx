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
export const ChevronDownIcon = ChevronIcon
export const ChevronUpIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(10, 6, size, p)}>
    <path d="M1 5l4-4 4 4" />
  </svg>
)
export const ChevronLeftIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(6, 10, size, p)}>
    <path d="M5 1 1 5l4 4" />
  </svg>
)
export const ChevronRightIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(6, 10, size, p)}>
    <path d="M1 1l4 4-4 4" />
  </svg>
)

/* ── 16×16 set ── */
const RING = 'M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z'

export const InfoIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d={`${RING}M8 7.2v4.3M8 4.6v.6`} />
  </svg>
)
export const WarningIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 1.8 14.8 14H1.2L8 1.8zM8 6.3v3.6M8 11.5v.6" />
  </svg>
)
export const ErrorIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d={`${RING}M8 4.6v4.6M8 10.9v.6`} />
  </svg>
)
export const AlertIcon = ErrorIcon
export const SuccessIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d={`${RING}M5 8.2l2 2 4-4.4`} />
  </svg>
)
export const CheckCircleIcon = SuccessIcon
export const HelpIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d={`${RING}M6 6.3a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3v.4M8 11.4v.6`} />
  </svg>
)
export const PlusIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 2.5v11M2.5 8h11" />
  </svg>
)
export const MinusIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M2.5 8h11" />
  </svg>
)
export const EditIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M10.5 2.5l3 3-8 8h-3v-3l8-8zM8.5 4.5l3 3" />
  </svg>
)
export const TrashIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M2.5 4h11M6 4V2h4v2M4 4l.7 10h6.6L12 4M6.5 6.5v5M9.5 6.5v5" />
  </svg>
)
export const DownloadIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 2v8.5M4.5 7 8 10.5 11.5 7M2.5 13.5h11" />
  </svg>
)
export const UploadIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 11V2.5M4.5 6 8 2.5 11.5 6M2.5 13.5h11" />
  </svg>
)
export const RefreshIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M12.2 1.6v2.7H9.5" />
  </svg>
)
export const SettingsIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M2 4.5h6.5M12 4.5h2M2 11.5h2M7.5 11.5H14M8.5 3h3v3h-3zM4 10h3v3H4z" />
  </svg>
)
export const FilterIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M1.5 2.5h13l-5 6v5l-3-1.5V8.5z" />
  </svg>
)
export const SortIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M4.5 2v11.5M2 11l2.5 2.5L7 11M9.5 3.5h5M9.5 7h3.5M9.5 10.5h2" />
  </svg>
)
export const MoreHorizontalIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M3.2 8h.6M7.7 8h.6M12.2 8h.6" strokeWidth={2} />
  </svg>
)
export const MoreVerticalIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 3.2v.6M8 7.7v.6M8 12.2v.6" strokeWidth={2} />
  </svg>
)
export const ArrowUpIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 14V2.5M3.5 7 8 2.5 12.5 7" />
  </svg>
)
export const ArrowDownIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 2v11.5M3.5 9 8 13.5 12.5 9" />
  </svg>
)
export const ArrowLeftIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M14 8H2.5M7 3.5 2.5 8 7 12.5" />
  </svg>
)
export const ArrowRightIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M2 8h11.5M9 3.5 13.5 8 9 12.5" />
  </svg>
)
export const ArrowUpRightIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M3.5 12.5 12 4M5.5 3.5h7v7" />
  </svg>
)
export const LinkIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M6.5 9.5l3-3M7 4.5l1.5-1.5a2.5 2.5 0 0 1 3.5 3.5L10.5 8M9 11.5 7.5 13A2.5 2.5 0 0 1 4 9.5L5.5 8" />
  </svg>
)
export const QRIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M2 2h4.5v4.5H2zM9.5 2H14v4.5H9.5zM2 9.5h4.5V14H2zM9.5 9.5H11V11M12.5 9.5H14M14 12v2h-2M9.5 12.5V14" />
  </svg>
)
export const CalendarIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M2 3.5h12v10H2zM2 6.5h12M5 2v3M11 2v3" />
  </svg>
)
export const ClockIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d={`${RING}M8 4.5V8l2.5 2`} />
  </svg>
)
export const HistoryIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M3.8 1.6v2.7h2.7M8 5v3l2 2" />
  </svg>
)
export const WalletIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M1.5 4.5h12v9h-12zM1.5 4.5l9-2.5v2.5M10 7.5h4v3h-4z" />
  </svg>
)
export const BellIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M3.5 12V7a4.5 4.5 0 0 1 9 0v5M2 12h12M6.5 14.5h3" />
  </svg>
)
export const UserIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM2.5 14.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
  </svg>
)
export const StarIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 1.8l1.5 4.5h4.7l-3.8 2.9 1.4 4.6L8 11l-3.8 2.8 1.4-4.6-3.8-2.9h4.7z" />
  </svg>
)
export const SunIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3" />
  </svg>
)
export const MoonIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M13.5 9.8A5.8 5.8 0 1 1 6.2 2.5a4.6 4.6 0 0 0 7.3 7.3z" />
  </svg>
)
export const LogoutIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M6.5 2.5h-4v11h4M10.5 5l3 3-3 3M13.5 8H6" />
  </svg>
)
export const SendIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M14.5 1.5 1.5 6.8l5.2 2.5 2.5 5.2 5.3-13zM6.7 9.3l7.8-7.8" />
  </svg>
)
export const ReceiveIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M8 1.5v8M4.5 6 8 9.5 11.5 6M2 10.5v3.5h12v-3.5" />
  </svg>
)
export const KeyIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M5 8.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM7.2 9.6 14 2.8M11.5 5.3l2 2M9.6 7.2l1.4 1.4" />
  </svg>
)
export const BridgeIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)}>
    <path d="M1 11h14M3 11V4.5M13 11V4.5M3 4.5Q8 11 13 4.5M5.5 11V8.6M8 11V8M10.5 11V8.6" />
  </svg>
)

/** Rotating arc on the shared `nui-spin` keyframe (static under reduced motion). Decorative: pair it with text, or use `Spinner`. */
export const SpinnerIcon = ({ size, className, ...p }: IconProps) => (
  <svg {...base(16, 16, size, p)} className={className ? `nui-icon-spin ${className}` : 'nui-icon-spin'}>
    <path d={RING} opacity={0.25} />
    <path d="M8 1.5A6.5 6.5 0 0 1 14.5 8" />
  </svg>
)
