import { Fragment, isValidElement, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { ChevronIcon, MenuIcon } from '../../icons'
import { cx } from '../../utils/cx'
import { IconButton } from '../actions'
import { Drawer } from '../overlays'
import { Brand, type BrandProps } from './Brand'
import { defaultRenderLink, externalProps, type RenderLink } from './link'

export interface NavItem {
  label: ReactNode
  /** Link target; omit on groups. */
  href?: string
  /** Marks the current page (aria-current="page"); a group is current when any child is. */
  current?: boolean
  /** Second line inside a dropdown panel. */
  description?: ReactNode
  /** Turns the item into a dropdown group. */
  children?: NavItem[]
}

export interface HeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** `{ name, sub, href, mark }` or any node. */
  brand?: BrandProps | ReactNode
  nav?: NavItem[]
  /** Right-side actions (hidden ≤640px; shown in the drawer instead unless `mobileActions` is set). */
  actions?: ReactNode
  /** Drawer-only actions for mobile. Defaults to `actions`. */
  mobileActions?: ReactNode
  sticky?: boolean
  bordered?: boolean
  /** Router adapter; receives href / className / aria-current / onClick / children. */
  renderLink?: RenderLink
  /** Menu button label + drawer title. Default `m.menu`. */
  menuLabel?: string
}

const isBrandProps = (b: unknown): b is BrandProps => !!b && typeof b === 'object' && !isValidElement(b) && 'name' in (b as object)
const groupCurrent = (it: NavItem) => it.current ?? it.children?.some((c) => c.current) ?? false

export function Header({
  brand,
  nav = [],
  actions,
  mobileActions,
  sticky,
  bordered,
  renderLink = defaultRenderLink,
  menuLabel,
  className,
  ...rest
}: HeaderProps) {
  const { m } = useNuiLocale()
  const uid = useId()
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const hoverOpened = useRef(false)
  const navRef = useRef<HTMLElement>(null)
  const panelId = (i: number) => `${uid}-panel-${i}`
  const triggerId = (i: number) => `${uid}-trigger-${i}`
  const drawerId = `${uid}-drawer`
  const label = menuLabel ?? m.menu

  // Outside click + Esc close an open dropdown.
  useEffect(() => {
    if (openIdx === null) return
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenIdx(null)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const idx = openIdx
      setOpenIdx(null)
      document.getElementById(triggerId(idx))?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openIdx])

  const link = (it: NavItem, cls: string, children: ReactNode, onClick?: () => void, key?: string | number) => (
    <Fragment key={key}>
      {renderLink({
        href: it.href ?? '#',
        className: cls,
        'aria-current': it.current ? 'page' : undefined,
        onClick,
        children,
        ...externalProps(it.href ?? ''),
      })}
    </Fragment>
  )

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== 'ArrowDown') return
    e.preventDefault()
    setOpenIdx(i)
    requestAnimationFrame(() => document.getElementById(panelId(i))?.querySelector<HTMLElement>('a,button')?.focus())
  }

  const brandNode = isBrandProps(brand) ? <Brand renderLink={renderLink} {...brand} /> : brand
  const drawerActions = mobileActions ?? actions

  return (
    <header
      className={cx('nui-header', sticky && 'nui-header--sticky', bordered && 'nui-header--bordered', className)}
      {...rest}
    >
      <div className="nui-header__inner nui-shell">
        {brandNode}
        {nav.length > 0 && (
          <nav ref={navRef} className="nui-nav" aria-label={m.primaryNav}>
            {nav.map((it, i) =>
              it.children?.length ? (
                <div
                  key={i}
                  className="nui-nav__group"
                  onMouseEnter={() => {
                    hoverOpened.current = true
                    setOpenIdx(i)
                  }}
                  onMouseLeave={() => setOpenIdx((cur) => (cur === i ? null : cur))}
                >
                  <button
                    type="button"
                    id={triggerId(i)}
                    className="nui-nav__trigger"
                    aria-expanded={openIdx === i}
                    aria-controls={panelId(i)}
                    data-current={groupCurrent(it) || undefined}
                    onClick={() => {
                      if (openIdx === i && !hoverOpened.current) setOpenIdx(null)
                      else setOpenIdx(i)
                      hoverOpened.current = false
                    }}
                    onKeyDown={(e) => onTriggerKey(e, i)}
                  >
                    {it.label}
                    <ChevronIcon className="nui-nav__chevron" />
                  </button>
                  <div id={panelId(i)} className="nui-nav__panel" hidden={openIdx !== i}>
                    {it.children.map((c, j) =>
                      link(
                        c,
                        'nui-nav__item',
                        <>
                          <span className="nui-nav__item-label">{c.label}</span>
                          {c.description !== undefined && <span className="nui-nav__item-desc">{c.description}</span>}
                        </>,
                        () => setOpenIdx(null),
                        j,
                      ),
                    )}
                  </div>
                </div>
              ) : (
                link(it, 'nui-nav__link', it.label, undefined, i)
              ),
            )}
          </nav>
        )}
        {actions !== undefined && <div className="nui-header__actions">{actions}</div>}
        {(nav.length > 0 || drawerActions !== undefined) && (
          <IconButton
            className="nui-header__menu"
            label={label}
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        )}
      </div>
      <Drawer id={drawerId} open={menuOpen} onClose={() => setMenuOpen(false)} title={label}>
        <nav className="nui-mobile-nav" aria-label={m.primaryNav}>
          {nav.map((it, i) =>
            it.children?.length ? (
              <div key={i} className="nui-mobile-nav__group">
                <p className="nui-mobile-nav__title">{it.label}</p>
                {it.children.map((c, j) => link(c, 'nui-mobile-nav__link', c.label, () => setMenuOpen(false), j))}
              </div>
            ) : (
              link(it, 'nui-mobile-nav__link', it.label, () => setMenuOpen(false), i)
            ),
          )}
        </nav>
        {drawerActions !== undefined && <div className="nui-mobile-nav__actions">{drawerActions}</div>}
      </Drawer>
    </header>
  )
}
