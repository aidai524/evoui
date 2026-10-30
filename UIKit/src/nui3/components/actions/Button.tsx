import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'
import { useNuiLocale } from '../../i18n'
import { ArrowIcon } from '../../icons'
import { cx } from '../../utils/cx'

export type ButtonVariant = 'ghost' | 'solid' | 'outline' | 'subtle' | 'danger' | 'invert' | 'underline'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `solid` is the one primary action per view (R2). Default `ghost`. */
  variant?: ButtonVariant
  size?: ButtonSize
  /** Full width. */
  block?: boolean
  /** Trailing arrow that moves 6px right on hover. */
  arrow?: boolean
  /** aria-busy + 12px spinner; blocks repeat clicks. */
  loading?: boolean
  /** Renders an `<a>`. External (http/https) links open in a new tab with rel=noopener noreferrer. */
  href?: string
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target']
  rel?: string
  download?: AnchorHTMLAttributes<HTMLAnchorElement>['download']
  /** HTMLButtonElement, or HTMLAnchorElement when `href` is set. */
  ref?: Ref<HTMLButtonElement | HTMLAnchorElement>
  children?: ReactNode
}

const isExternal = (href: string) => /^https?:\/\//i.test(href)

export function Button({
  variant = 'ghost',
  size = 'md',
  block,
  arrow,
  loading,
  href,
  target,
  rel,
  download,
  disabled,
  className,
  children,
  type = 'button',
  onClick,
  ref,
  ...rest
}: ButtonProps) {
  const { m } = useNuiLocale()
  const cls = cx(
    'nui-btn',
    variant !== 'ghost' && `nui-btn--${variant}`,
    size !== 'md' && `nui-btn--${size}`,
    block && 'nui-btn--block',
    className,
  )
  const content = (
    <>
      {loading && <span className="nui-spinner" aria-hidden="true" />}
      {children}
      {arrow && <ArrowIcon className="nui-btn__arrow" />}
    </>
  )

  if (href !== undefined) {
    const external = isExternal(href)
    const inactive = disabled || loading
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        className={cls}
        href={inactive ? undefined : href}
        target={target ?? (external ? '_blank' : undefined)}
        rel={rel ?? (external ? 'noopener noreferrer' : undefined)}
        download={download}
        aria-disabled={inactive || undefined}
        aria-busy={loading || undefined}
        tabIndex={inactive ? -1 : undefined}
        onClick={onClick as unknown as (e: MouseEvent<HTMLAnchorElement>) => void}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
        {external && (target ?? '_blank') === '_blank' && <span className="nui-sr-only"> ({m.opensInNewTab})</span>}
      </a>
    )
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...rest}
    >
      {content}
    </button>
  )
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Required: used as aria-label and title. */
  label: string
  size?: 'sm' | 'md'
  ref?: Ref<HTMLButtonElement>
  /** The icon. */
  children?: ReactNode
}

export function IconButton({ label, size = 'md', className, type = 'button', title, children, ref, ...rest }: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('nui-icon-btn', size === 'sm' && 'nui-icon-btn--sm', className)}
      aria-label={label}
      title={title ?? label}
      {...rest}
    >
      {children}
    </button>
  )
}
