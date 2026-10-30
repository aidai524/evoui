import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

export type BadgeTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info' | 'accent'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  /** 6px status dot before the text. */
  dot?: boolean
  /** 12% tinted background. (`accent` is always solid accent + on-accent.) */
  solid?: boolean
  children?: ReactNode
}

export function Badge({ tone = 'neutral', dot, solid, className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx('nui-badge', tone !== 'neutral' && `nui-badge--${tone}`, dot && 'nui-badge--dot', solid && 'nui-badge--solid', className)}
      {...rest}
    />
  )
}
