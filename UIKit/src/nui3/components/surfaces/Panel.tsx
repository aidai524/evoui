import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  /** Right side of the head (filters, a ghost button…). */
  actions?: ReactNode
  footer?: ReactNode
  /** surface-sunken background. */
  sunken?: boolean
  /** Body without padding — for an embedded DataTable (its wrapper border collapses to 0). */
  flush?: boolean
  /** Heading element for the title (default h3). */
  titleAs?: ElementType
  as?: ElementType
}

export function Panel({ title, actions, footer, sunken, flush, titleAs: Title = 'h3', as: Tag = 'section', className, children, ...rest }: PanelProps) {
  return (
    <Tag className={cx('nui-panel', sunken && 'nui-panel--sunken', flush && 'nui-panel--flush', className)} {...rest}>
      {(title != null || actions != null) && (
        <div className="nui-panel__head">
          {title != null ? <Title className="nui-panel__title">{title}</Title> : <span />}
          {actions != null && <div className="nui-panel__actions">{actions}</div>}
        </div>
      )}
      <div className="nui-panel__body">{children}</div>
      {footer != null && <div className="nui-panel__foot">{footer}</div>}
    </Tag>
  )
}
