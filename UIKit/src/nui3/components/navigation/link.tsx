import type { AnchorHTMLAttributes, MouseEventHandler, ReactNode } from 'react'

/** Props a router adapter receives. Spread them onto your router's link component. */
export interface RenderLinkProps {
  href: string
  className?: string
  children?: ReactNode
  'aria-current'?: 'page' | undefined
  onClick?: MouseEventHandler<HTMLAnchorElement>
  target?: string
  rel?: string
  [key: string]: unknown
}

/** Router adapter: `renderLink={(p) => <NextLink {...p} />}`. Default renders a plain `<a>`. */
export type RenderLink = (props: RenderLinkProps) => ReactNode

export const defaultRenderLink: RenderLink = ({ children, ...p }) => <a {...(p as AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>

export const isExternalHref = (href: string) => /^https?:\/\//i.test(href)

/** target/rel for external links. */
export const externalProps = (href: string) => (isExternalHref(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})
