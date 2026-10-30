import type { DetailsHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

export interface DisclosureProps extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'title'> {
  /** Summary row text. */
  summary: ReactNode
  /** Initially open (uncontrolled; native `<details>`). */
  defaultOpen?: boolean
  children?: ReactNode
}

/** Native `<details>` for FAQ, advanced settings, rules. Keyboard and state come from the platform. */
export function Disclosure({ summary, defaultOpen, open, className, children, ...rest }: DisclosureProps) {
  return (
    <details className={cx('nui-disclosure', className)} open={open ?? defaultOpen} {...rest}>
      <summary className="nui-disclosure__summary">{summary}</summary>
      <div className="nui-disclosure__body">{children}</div>
    </details>
  )
}
