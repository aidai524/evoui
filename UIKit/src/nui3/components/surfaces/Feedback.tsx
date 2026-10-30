import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** 0–100. Omit for the indeterminate variant (30% bar looping 1.4s). */
  value?: number
  /** Accessible name (aria-label). */
  label?: string
}

export function Progress({ value, label, className, style, ...rest }: ProgressProps) {
  const indeterminate = value == null || !Number.isFinite(value)
  const v = indeterminate ? 0 : Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(v)}
      aria-busy={indeterminate || undefined}
      className={cx('nui-progress', indeterminate && 'nui-progress--indeterminate', className)}
      style={{ '--nui-value': `${v}%`, ...style } as CSSProperties}
      {...rest}
    >
      <span className="nui-progress__fill" />
    </div>
  )
}

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  width?: CSSProperties['width']
  /** Default 1em (follows the surrounding font size). */
  height?: CSSProperties['height']
  /** Render N stacked text lines (last one at 60%). */
  lines?: number
}

/** Loading placeholder with shimmer. Always aria-hidden — announce loading on the container (aria-busy). */
export function Skeleton({ width, height, lines, className, style, ...rest }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <span className={cx('nui-skeleton-lines', className)} aria-hidden="true" style={style} {...rest}>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="nui-skeleton" style={{ width: i === lines - 1 ? '60%' : width, height }} />
        ))}
      </span>
    )
  }
  return <span className={cx('nui-skeleton', className)} aria-hidden="true" style={{ width, height, ...style }} {...rest} />
}

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  hint?: ReactNode
  /** One action (a Button). */
  action?: ReactNode
  /** Heading element for the title (default h3). */
  titleAs?: ElementType
}

/** Empty table / list / search result: serif display-s title + one-line hint + one action. */
export function EmptyState({ title, hint, action, titleAs: Title = 'h3', className, ...rest }: EmptyStateProps) {
  return (
    <div className={cx('nui-empty', className)} {...rest}>
      <Title className="nui-empty__title">{title}</Title>
      {hint != null && <p className="nui-empty__hint">{hint}</p>}
      {action != null && <div className="nui-empty__action">{action}</div>}
    </div>
  )
}
