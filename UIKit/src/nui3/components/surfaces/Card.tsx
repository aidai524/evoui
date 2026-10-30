import type { AnchorHTMLAttributes, ElementType, HTMLAttributes, ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { ArrowIcon } from '../../icons'
import { cx } from '../../utils/cx'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  /** Pointer cursor + accent bottom rule that grows from the left on hover / focus-within. Pair with a `CardLink stretched`. */
  interactive?: boolean
  children?: ReactNode
}

/** Surface container. Children use the `nui-card__*` element classes (head, logo, index, title, desc, foot, tags, link). */
export function Card({ as: Tag = 'article', interactive, className, ...rest }: CardProps) {
  return <Tag className={cx('nui-card', interactive && 'nui-card--interactive', className)} {...rest} />
}

export interface CardLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** `::before` covers the whole card so the card is clickable while the DOM has one real link (03 §6). */
  stretched?: boolean
  /** Show the trailing arrow (default true). */
  arrow?: boolean
}

const isExternal = (href?: string) => !!href && /^https?:\/\//.test(href)

/** `.nui-card__link`: 11px uppercase link + arrow. External hrefs open in a new tab with an sr-only hint. */
export function CardLink({ stretched, arrow = true, className, href, children, target, rel, ...rest }: CardLinkProps) {
  const { m } = useNuiLocale()
  const ext = isExternal(href)
  return (
    <a
      className={cx('nui-card__link', stretched && 'nui-card__link--stretched', className)}
      href={href}
      target={target ?? (ext ? '_blank' : undefined)}
      rel={rel ?? (ext ? 'noopener noreferrer' : undefined)}
      {...rest}
    >
      {children}
      {ext && <span className="nui-sr-only"> ({m.opensInNewTab})</span>}
      {arrow && <ArrowIcon size={14} />}
    </a>
  )
}

export interface ProjectCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  name: string
  description?: ReactNode
  href?: string
  tags?: string[]
  /** Logo node (img / svg / initials) placed in the 42×42 logo box. */
  logo?: ReactNode
  /** Ordinal shown top-right, zero-padded to two digits. */
  index?: number
  /** Link text, defaults to m.open. */
  linkLabel?: string
  /** Heading element for the name (default h3). */
  titleAs?: ElementType
}

/** Ready-made Card for app directories: logo, index, title, 3-line description, tags and one stretched link. */
export function ProjectCard({ name, description, href, tags, logo, index, linkLabel, titleAs: Title = 'h3', className, ...rest }: ProjectCardProps) {
  const { m } = useNuiLocale()
  return (
    <Card interactive={!!href} className={className} {...rest}>
      {index != null && (
        <span className="nui-card__index" aria-hidden="true">
          {String(index).padStart(2, '0')}
        </span>
      )}
      <div className="nui-card__head">
        {logo != null && <span className="nui-card__logo">{logo}</span>}
        <Title className="nui-card__title">{name}</Title>
      </div>
      {description != null && <p className="nui-card__desc">{description}</p>}
      {(tags?.length || href) && (
        <div className="nui-card__foot">
          {tags?.length ? (
            <ul className="nui-card__tags">
              {tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <span />
          )}
          {href && (
            <CardLink href={href} stretched>
              {linkLabel ?? m.open}
              <span className="nui-sr-only"> {name}</span>
            </CardLink>
          )}
        </div>
      )}
    </Card>
  )
}
