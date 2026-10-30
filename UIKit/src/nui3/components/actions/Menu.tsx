// Dropdown action menu (WAI-ARIA menu button): trigger element + portaled FloatingPanel with role=menu.
import {
  cloneElement,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from '../../utils/cx'
import { FloatingPanel, type Placement } from '../overlays/floating'
import { isTypeaheadKey, moveIndex, typeaheadIndex, useTypeahead, type NavMove } from '../overlays/listNav'
import { assignRef } from '../overlays/refs'

export interface MenuActionItem {
  type?: 'item'
  label: ReactNode
  /** Leading 16px visual. */
  icon?: ReactNode
  /** Display-only hint, e.g. "⌘C" (the menu does not bind it). */
  shortcut?: string
  onSelect?: () => void
  disabled?: boolean
  /** `negative` for destructive actions (remove, revoke). */
  tone?: 'negative'
  /** Plain text for type-ahead when `label` is not a string. */
  textValue?: string
}
export interface MenuSeparatorItem {
  type: 'separator'
}
export interface MenuLabelItem {
  type: 'label'
  label: ReactNode
}
export type MenuItem = MenuActionItem | MenuSeparatorItem | MenuLabelItem

export interface MenuProps {
  /** The button that opens the menu (Button, IconButton…). It receives ref, aria-haspopup, aria-expanded and handlers. */
  trigger: ReactElement
  items: MenuItem[]
  placement?: Placement
  /** Accessible name of the menu; defaults to the trigger's text (aria-labelledby). */
  label?: string
  onOpenChange?: (open: boolean) => void
  /** Class for the floating panel. */
  className?: string
}

const isAction = (it: MenuItem): it is MenuActionItem => it.type === undefined || it.type === 'item'
const plain = (n: ReactNode) => (typeof n === 'string' || typeof n === 'number' ? String(n) : '')

type TriggerProps = {
  id?: string
  ref?: Ref<HTMLElement>
  onClick?: (e: MouseEvent<HTMLElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void
}

/**
 * Action menu. ↓ / Enter / Space on the trigger open it on the first item, ↑ on the last; inside, ↑/↓ wrap,
 * Home/End jump, letters type-ahead, Enter/Space run the item and close, Esc closes and returns focus.
 */
export function Menu({ trigger, items, placement = 'bottom-start', label, onOpenChange, className }: MenuProps) {
  const uid = useId()
  const tp = trigger.props as TriggerProps
  const triggerId = tp.id ?? `${uid}-trigger`
  const menuId = `${uid}-menu`
  const triggerRef = useRef<HTMLElement | null>(null)
  const [menuEl, setMenuEl] = useState<HTMLDivElement | null>(null)
  const [open, setOpenState] = useState(false)
  /** Index into `actions`; -1 = the menu itself has focus. */
  const [active, setActive] = useState(-1)
  const typeahead = useTypeahead()

  const actions = items.filter(isAction)
  const hasIcons = actions.some((a) => a.icon !== undefined)

  const setOpen = (next: boolean) => {
    setOpenState(next)
    onOpenChange?.(next)
  }
  const show = (to: NavMove | 'none') => {
    setActive(to === 'none' ? -1 : moveIndex(actions, -1, to))
    setOpen(true)
  }
  const close = (focusTrigger = true) => {
    setOpen(false)
    typeahead.reset()
    if (focusTrigger) triggerRef.current?.focus({ preventScroll: true })
  }
  const run = (a: MenuActionItem | undefined) => {
    if (!a || a.disabled) return
    close()
    a.onSelect?.()
  }

  // Roving focus: DOM focus follows the active item (or rests on the menu).
  useLayoutEffect(() => {
    if (!open || !menuEl) return
    const target = active >= 0 ? menuEl.querySelectorAll<HTMLElement>('[role="menuitem"]')[active] : menuEl
    target?.focus({ preventScroll: true })
    if (active >= 0) target?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active, menuEl])

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        setActive((a) => moveIndex(actions, a, 1, true))
        break
      case 'ArrowUp':
        setActive((a) => moveIndex(actions, a, -1, true))
        break
      case 'Home':
      case 'PageUp':
        setActive(moveIndex(actions, -1, 'first'))
        break
      case 'End':
      case 'PageDown':
        setActive(moveIndex(actions, -1, 'last'))
        break
      case 'Enter':
        run(actions[active])
        break
      case ' ':
        if (typeahead.pending()) typeTo(' ')
        else run(actions[active])
        break
      case 'Escape':
        e.stopPropagation() // keep an enclosing Dialog open
        close()
        break
      case 'Tab':
        // Focus the trigger and let the browser tab on from there (the panel lives at the end of the document).
        close()
        return
      default:
        if (!isTypeaheadKey(e)) return
        typeTo(e.key)
    }
    e.preventDefault()
  }

  const typeTo = (char: string) => {
    const q = typeahead.push(char)
    const i = typeaheadIndex(
      actions.map((a) => a.textValue ?? plain(a.label)),
      (k) => Boolean(actions[k].disabled),
      q,
      active,
    )
    if (i >= 0) setActive(i)
  }

  const ownRef = tp.ref
  const triggerEl = cloneElement(trigger as ReactElement<TriggerProps & Record<string, unknown>>, {
    id: triggerId,
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node
      assignRef(ownRef, node)
    },
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onClick: (e: MouseEvent<HTMLElement>) => {
      tp.onClick?.(e)
      if (e.defaultPrevented) return
      if (open) close()
      else show(e.detail === 0 ? 'first' : 'none')
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      tp.onKeyDown?.(e)
      if (e.defaultPrevented) return
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') show('first')
      else if (e.key === 'ArrowUp') show('last')
      else return
      e.preventDefault()
    },
  })

  let n = -1
  return (
    <>
      {triggerEl}
      <FloatingPanel
        open={open}
        anchor={triggerRef}
        placement={placement}
        returnFocus={false}
        onDismiss={(reason) => close(reason === 'escape')}
        className={cx('nui-menu', className)}
      >
        <div
          ref={setMenuEl}
          id={menuId}
          role="menu"
          tabIndex={-1}
          className="nui-menu__list"
          aria-label={label}
          aria-labelledby={label ? undefined : triggerId}
          onKeyDown={onMenuKeyDown}
          onPointerLeave={() => open && setActive(-1)}
        >
          {items.map((it, k) => {
            if (it.type === 'separator') return <div key={k} role="separator" className="nui-menu__separator" />
            if (it.type === 'label')
              return (
                <div key={k} role="presentation" className="nui-menu__heading">
                  {it.label}
                </div>
              )
            const i = ++n
            return (
              <div
                key={k}
                role="menuitem"
                tabIndex={-1}
                className="nui-menu__item"
                aria-disabled={it.disabled || undefined}
                data-tone={it.tone}
                data-active={i === active || undefined}
                onPointerMove={() => !it.disabled && active !== i && setActive(i)}
                onClick={() => run(it)}
              >
                {hasIcons && <span className="nui-menu__icon">{it.icon}</span>}
                <span className="nui-menu__label">{it.label}</span>
                {it.shortcut && <kbd className="nui-menu__shortcut">{it.shortcut}</kbd>}
              </div>
            )
          })}
        </div>
      </FloatingPanel>
    </>
  )
}
