import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { useNuiLocale } from '../../i18n'
import { CloseIcon } from '../../icons'
import { cx } from '../../utils/cx'
import { IconButton } from '../actions'

/** Longest exit animation is ~240ms; close anyway if `animationend` never arrives. */
const EXIT_TIMEOUT = 600

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/* Page scroll lock while any modal is open. The gutter is reserved only when the page actually shows a
   classic scrollbar, so hiding overflow never shifts the layout sideways. */
let locks = 0
let saved: { overflow: string; gutter: string } | null = null
function lockScroll() {
  if (locks++ > 0) return
  const root = document.documentElement
  saved = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter }
  const hasScrollbar = window.innerWidth - root.clientWidth > 0
  root.style.overflow = 'hidden'
  if (hasScrollbar) root.style.scrollbarGutter = 'stable'
}
function unlockScroll() {
  if (locks === 0 || --locks > 0 || !saved) return
  const root = document.documentElement
  root.style.overflow = saved.overflow
  root.style.scrollbarGutter = saved.gutter
  saved = null
}

/**
 * Native <dialog> + showModal(): Esc / backdrop close unless `dismissible` is false;
 * focus returns to the element that was focused when the dialog opened.
 * Closing sets data-state="closed" and keeps the dialog (and its children) up until the exit
 * animation ends, then calls close(); immediate under prefers-reduced-motion.
 */
function useModal(open: boolean, onClose: () => void, dismissible: boolean) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const locked = useRef(false)
  const state = useRef({ open, onClose, dismissible })
  state.current = { open, onClose, dismissible }
  const backdropDown = useRef(false)

  // Content stays rendered from the first open until the exit animation has finished.
  const [shown, setShown] = useState(open)
  if (open && !shown) setShown(true)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !open || el.open) return
    returnTo.current = document.activeElement as HTMLElement | null
    el.showModal()
    if (!locked.current) {
      lockScroll()
      locked.current = true
    }
  }, [open])

  useEffect(() => {
    const el = ref.current
    if (!el || open || !el.open) return
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      el.close()
      setShown(false)
      if (locked.current) {
        unlockScroll()
        locked.current = false
      }
      const target = returnTo.current
      returnTo.current = null
      if (target && document.contains(target)) target.focus()
    }
    if (reducedMotion() || getComputedStyle(el).animationName === 'none') {
      finish()
      return
    }
    const timer = window.setTimeout(finish, EXIT_TIMEOUT)
    // The panel's own exit animation (not the ::backdrop one) decides when to close.
    const onEnd = (e: AnimationEvent) => {
      if (e.target === el && !e.pseudoElement) finish()
    }
    el.addEventListener('animationend', onEnd)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('animationend', onEnd)
    }
  }, [open])

  useEffect(() => {
    const el = ref.current
    return () => {
      el?.close()
      if (locked.current) {
        unlockScroll()
        locked.current = false
      }
    }
  }, [])

  const handlers = {
    onCancel: (e: SyntheticEvent<HTMLDialogElement>) => {
      e.preventDefault()
      if (state.current.open && state.current.dismissible) state.current.onClose()
    },
    onKeyDown: (e: ReactKeyboardEvent<HTMLDialogElement>) => {
      if (e.key !== 'Escape') return
      // Prevent the native close request so a non-dismissible dialog can't be closed by a second Esc.
      e.preventDefault()
      if (state.current.open && state.current.dismissible) state.current.onClose()
    },
    onClose: () => {
      // Closed natively (e.g. <form method="dialog">) while still open in props.
      const s = state.current
      if (!s.open) return
      if (s.dismissible) s.onClose()
      else ref.current?.showModal()
    },
    onMouseDown: (e: ReactMouseEvent<HTMLDialogElement>) => {
      backdropDown.current = isBackdrop(e)
    },
    onClick: (e: ReactMouseEvent<HTMLDialogElement>) => {
      if (backdropDown.current && isBackdrop(e) && state.current.open && state.current.dismissible) state.current.onClose()
      backdropDown.current = false
    },
  }
  return { ref, handlers, shown, dataState: open ? 'open' : 'closed' }
}

function isBackdrop(e: ReactMouseEvent<HTMLDialogElement>) {
  if (e.target !== e.currentTarget) return false
  const r = e.currentTarget.getBoundingClientRect()
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
}

/* ───────────────────────── Dialog ───────────────────────── */

export interface DialogProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'title' | 'onClose'> {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Right-aligned action row. One `solid` button at most (R2). */
  footer?: ReactNode
  /** Max width: number (px) or CSS length. Default 480px. */
  width?: number | string
  /** false while signing/submitting: ignores Esc and backdrop clicks and hides the close button. */
  dismissible?: boolean
}

/** Centred modal: fades in with an 8px rise, reverses on close (children stay rendered until it ends). */
export function Dialog({ open, onClose, title, footer, width, dismissible = true, className, style, children, ...rest }: DialogProps) {
  const { m } = useNuiLocale()
  const titleId = useId()
  const { ref, handlers, shown, dataState } = useModal(open, onClose, dismissible)
  const w = width === undefined ? undefined : typeof width === 'number' ? `${width}px` : width
  return (
    <dialog
      ref={ref}
      className={cx('nui-dialog', className)}
      data-state={dataState}
      aria-labelledby={titleId}
      style={{ ...(w ? { '--nui-dialog-w': w } : null), ...style } as CSSProperties}
      {...handlers}
      {...rest}
    >
      {shown && (
        <>
          <div className="nui-dialog__head">
            <h2 className="nui-dialog__title" id={titleId}>
              {title}
            </h2>
            {dismissible && (
              <IconButton label={m.close} onClick={onClose}>
                <CloseIcon />
              </IconButton>
            )}
          </div>
          <div className="nui-dialog__body">{children}</div>
          {footer !== undefined && <div className="nui-dialog__foot">{footer}</div>}
        </>
      )}
    </dialog>
  )
}

/* ───────────────────────── Drawer ───────────────────────── */

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'title' | 'onClose'> {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Edge the sheet is pushed in from. `bottom` is a full-width sheet (mobile actions). */
  side?: 'right' | 'left' | 'bottom'
  footer?: ReactNode
  dismissible?: boolean
}

/** Side sheet on native <dialog>: pushed in the full distance from its edge, pushed back out on close. */
export function Drawer({ open, onClose, title, side = 'right', footer, dismissible = true, className, children, ...rest }: DrawerProps) {
  const { m } = useNuiLocale()
  const titleId = useId()
  const { ref, handlers, shown, dataState } = useModal(open, onClose, dismissible)
  return (
    <dialog
      ref={ref}
      className={cx('nui-drawer', className)}
      data-side={side}
      data-state={dataState}
      aria-labelledby={titleId}
      {...handlers}
      {...rest}
    >
      {shown && (
        <>
          <div className="nui-drawer__head">
            <h2 className="nui-drawer__title" id={titleId}>
              {title}
            </h2>
            {dismissible && (
              <IconButton label={m.close} onClick={onClose}>
                <CloseIcon />
              </IconButton>
            )}
          </div>
          <div className="nui-drawer__body">{children}</div>
          {footer !== undefined && <div className="nui-drawer__foot">{footer}</div>}
        </>
      )}
    </dialog>
  )
}
