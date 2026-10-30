import { Fragment, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { defaultRenderLink, externalProps, type RenderLink } from './link'

/* ───────────────────────── Breadcrumb ───────────────────────── */

export interface BreadcrumbItem {
  label: ReactNode
  /** Omit on the last item (current page). */
  href?: string
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
  renderLink?: RenderLink
}

/** Last item is the current page: a `<span aria-current="page">`. */
export function Breadcrumb({ items, renderLink = defaultRenderLink, className, ...rest }: BreadcrumbProps) {
  const { m } = useNuiLocale()
  return (
    <nav aria-label={m.breadcrumb} className={cx('nui-breadcrumb', className)} {...rest}>
      <ol className="nui-breadcrumb__list">
        {items.map((it, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="nui-breadcrumb__item">
              {last || it.href === undefined ? (
                <span aria-current={last ? 'page' : undefined}>{it.label}</span>
              ) : (
                renderLink({ href: it.href, className: 'nui-breadcrumb__link', children: it.label })
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ───────────────────────── Footer ───────────────────────── */

export interface FooterLink {
  label: ReactNode
  href: string
}

export interface FooterColumn {
  title: ReactNode
  links: FooterLink[]
}

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  /** First column: brand node (e.g. `<Brand>`). */
  brand?: ReactNode
  /** Short line under the brand (max 28ch). */
  tagline?: ReactNode
  columns?: FooterColumn[]
  /** Left side of the legal row, e.g. "© 2026 Noir · Sample data only". */
  legal?: ReactNode
  /**
   * Affiliation disclaimer. Always rendered (R10): may be reworded, never removed — empty values fall back
   * to `m.disclaimer` (DEFAULT_DISCLAIMER).
   */
  disclaimer?: ReactNode
  renderLink?: RenderLink
}

export function Footer({ brand, tagline, columns = [], legal, disclaimer, renderLink = defaultRenderLink, className, style, children, ...rest }: FooterProps) {
  const { m } = useNuiLocale()
  const text = disclaimer === undefined || disclaimer === null || disclaimer === false || disclaimer === '' ? m.disclaimer : disclaimer
  return (
    <footer className={cx('nui-footer', className)} style={{ '--nui-footer-cols': Math.max(1, columns.length), ...style } as CSSProperties} {...rest}>
      <div className="nui-shell">
        <div className="nui-footer__grid">
          <div className="nui-footer__brand">
            {brand}
            {tagline !== undefined && <p className="nui-footer__tagline">{tagline}</p>}
          </div>
          {columns.map((col, i) => (
            <div key={i} className="nui-footer__col">
              <p className="nui-footer__title">{col.title}</p>
              <ul className="nui-footer__links">
                {col.links.map((l, j) => (
                  <li key={j}>{renderLink({ href: l.href, className: 'nui-footer__link', children: l.label, ...externalProps(l.href) })}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {children}
        <div className="nui-footer__legal">
          {legal !== undefined && <p>{legal}</p>}
          <p className="nui-footer__disclaimer">{text}</p>
        </div>
      </div>
    </footer>
  )
}

/* ───────────────────────── SubNav ───────────────────────── */

export interface SubNavItem {
  label: ReactNode
  href: string
  current?: boolean
  /** Small count/badge after the label. */
  badge?: ReactNode
}

export interface SubNavProps extends HTMLAttributes<HTMLElement> {
  items: SubNavItem[]
  /** Accessible name of the nav landmark. */
  label: string
  renderLink?: RenderLink
}

/** In-product page navigation (links, not tabs). Current item: aria-current="page". */
export function SubNav({ items, label, renderLink = defaultRenderLink, className, ...rest }: SubNavProps) {
  return (
    <nav aria-label={label} className={cx('nui-subnav', className)} {...rest}>
      {items.map((it, i) => (
        <Fragment key={i}>
          {renderLink({
            href: it.href,
            className: 'nui-subnav__link',
            'aria-current': it.current ? 'page' : undefined,
            children: (
              <>
                {it.label}
                {it.badge !== undefined && <span className="nui-subnav__badge">{it.badge}</span>}
              </>
            ),
          })}
        </Fragment>
      ))}
    </nav>
  )
}
