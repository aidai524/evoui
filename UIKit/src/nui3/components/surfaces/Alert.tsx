import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

export type AlertTone = 'info' | 'positive' | 'negative' | 'warning' | 'shielded'

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  /** Optional trailing action (retry button, link). */
  action?: ReactNode
}

/** Inline message. `negative` → role="alert"; others → role="status". Risk disclosure must use `warning` with concrete wording. */
export function Alert({ tone = 'info', title, action, className, children, role, ...rest }: AlertProps) {
  return (
    <div className={cx('nui-alert', `nui-alert--${tone}`, className)} role={role ?? (tone === 'negative' ? 'alert' : 'status')} {...rest}>
      <div className="nui-alert__content">
        {title != null && <p className="nui-alert__title">{title}</p>}
        {children != null && <div className="nui-alert__body">{children}</div>}
      </div>
      {action != null && <div className="nui-alert__action">{action}</div>}
    </div>
  )
}
