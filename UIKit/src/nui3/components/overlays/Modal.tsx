import {
  useEffect,
  useId,
  useRef,
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

/**
 * Native <dialog> + showModal(): Esc / backdrop close unless `dismissible` is false;
 * focus returns to the element that was focused when the dialog opened.
 */
function useModal(open: boolean, onClose: () => void, dismissible: boolean) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const state = useRef({ open, onClose, dismissible })
  state.current = { open, onClose, dismissible }
  const backdropDown = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      returnTo.current = document.activeElement as HTMLElement | null
      el.showModal()
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  // Restore focus when closing (and on unmount while open).
  useEffect(() => {
    if (open) return
    const target = returnTo.current
    returnTo.current = null
    if (target && document.contains(target)) target.focus()
  }, [open])
  useEffect(() => () => ref.current?.close(), [])

  const handlers = {
    onCancel: (e: SyntheticEvent<HTMLDialogElement>) => {
      e.preventDefault()
      if (state.current.dismissible) state.current.onClose()
    },
    onKeyDown: (e: ReactKeyboardEvent<HTMLDialogElement>) => {
      if (e.key !== 'Escape') return
      // Prevent the native close request so a non-dismissible dialog can't be closed by a second Esc.
      e.preventDefault()
      if (state.current.dismissible) state.current.onClose()
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
      if (backdropDown.current && isBackdrop(e) && state.current.dismissible) state.current.onClose()
      backdropDown.current = false
    },
  }
  return { ref, handlers }
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

export function Dialog({ open, onClose, title, footer, width, dismissible = true, className, style, children, ...rest }: DialogProps) {
  const { m } = useNuiLocale()
  const titleId = useId()
  const { ref, handlers } = useModal(open, onClose, dismissible)
  const w = width === undefined ? undefined : typeof width === 'number' ? `${width}px` : width
  return (
    <dialog
      ref={ref}
      className={cx('nui-dialog', className)}
      aria-labelledby={titleId}
      style={{ ...(w ? { '--nui-dialog-w': w } : null), ...style } as CSSProperties}
      {...handlers}
      {...rest}
    >
      {open && (
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
  side?: 'right' | 'left'
  footer?: ReactNode
  dismissible?: boolean
}

/** Full-height side sheet on native <dialog>; slides in ±24px. */
export function Drawer({ open, onClose, title, side = 'right', footer, dismissible = true, className, children, ...rest }: DrawerProps) {
  const { m } = useNuiLocale()
  const titleId = useId()
  const { ref, handlers } = useModal(open, onClose, dismissible)
  return (
    <dialog ref={ref} className={cx('nui-drawer', className)} data-side={side} aria-labelledby={titleId} {...handlers} {...rest}>
      {open && (
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
