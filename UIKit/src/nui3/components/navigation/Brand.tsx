import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { defaultRenderLink, type RenderLink } from './link'

export interface ZcashMarkProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Pixel size (square). Default 40. */
  size?: number
  /** Full-colour or single-colour (currentColor) mark. The mark is never recoloured beyond this. */
  variant?: 'color' | 'mono'
  /** Accessible name; when set the mark is role=img, otherwise aria-hidden. */
  title?: string
  /** Link target. Default https://z.cash/; pass null to render the bare mark (e.g. inside another link). */
  href?: string | null
}

/**
 * Zcash mark.
 * TODO(brand): placeholder drawing — replace this SVG with the official Zcash logo asset
 * (https://z.cash/press/) before release. Colours are the brand's fixed values, not theme tokens,
 * because the mark must never be recoloured (R10).
 */
export function ZcashMark({ size = 40, variant = 'color', title, href = 'https://z.cash/', className, ...rest }: ZcashMarkProps) {
  const maskId = `nui-zm-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const z = 'M12 11h16v4L17.6 25H28v4H12v-4l10.4-10H12z M18.5 7h3v4h-3z M18.5 29h3v4h-3z'
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {variant === 'color' ? (
        <>
          <circle cx="20" cy="20" r="20" fill="#f3b724" />
          <path d={z} fill="#271219" />
        </>
      ) : (
        <>
          <mask id={maskId}>
            <rect width="40" height="40" fill="#fff" />
            <path d={z} fill="#000" />
          </mask>
          <circle cx="20" cy="20" r="20" fill="currentColor" mask={`url(#${maskId})`} />
        </>
      )}
    </svg>
  )
  if (href === null)
    return (
      <span className={cx('nui-zcash-mark', className)} {...rest}>
        {svg}
      </span>
    )
  const external = /^https?:\/\//.test(href)
  return (
    <a
      className={cx('nui-zcash-mark', className)}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={title ? undefined : 'Zcash'}
      {...rest}
    >
      {svg}
    </a>
  )
}

export interface BrandProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Product name — must not contain "Zcash" (R10). */
  name: ReactNode
  /** Small uppercase sub-label after a hairline (hidden ≤480px). */
  sub?: ReactNode
  href?: string
  /** 40×40 mark; defaults to the (unlinked) ZcashMark. */
  mark?: ReactNode
  renderLink?: RenderLink
}

export function Brand({ name, sub, href, mark, renderLink = defaultRenderLink, className, ...rest }: BrandProps) {
  const children = (
    <>
      <span className="nui-brand__mark">{mark ?? <ZcashMark href={null} size={40} />}</span>
      <span className="nui-brand__name">{name}</span>
      {sub !== undefined && <span className="nui-brand__sub">{sub}</span>}
    </>
  )
  if (href === undefined)
    return (
      <span className={cx('nui-brand', className)} {...rest}>
        {children}
      </span>
    )
  return <>{renderLink({ href, className: cx('nui-brand', className), children, ...(rest as object) })}</>
}
