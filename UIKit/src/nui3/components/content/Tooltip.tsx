import { cloneElement, isValidElement, useEffect, useId, useState, type HTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { cx } from '../../utils/cx'

export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'content'> {
  content: ReactNode
  /** Bubble above (default) or below the trigger. */
  side?: 'top' | 'bottom'
  /** The trigger. A single focusable element gets `aria-describedby` wired automatically. */
  children: ReactNode
}

/** Shows on hover or focus-within; Esc hides until the pointer/focus leaves and returns. */
export function Tooltip({ content, side = 'top', children, className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest }: TooltipProps) {
  const id = useId()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHidden(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': cx((children as ReactElement<{ 'aria-describedby'?: string }>).props['aria-describedby'], id) || undefined,
      })
    : children

  return (
    <span
      className={cx('nui-tooltip', className)}
      data-side={side === 'bottom' ? 'bottom' : undefined}
      data-hidden={hidden || undefined}
      onMouseEnter={(e) => {
        setHidden(false)
        onMouseEnter?.(e)
      }}
      onFocus={(e) => {
        setHidden(false)
        onFocus?.(e)
      }}
      onMouseLeave={(e) => {
        setHidden(false)
        onMouseLeave?.(e)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHidden(false)
        onBlur?.(e)
      }}
      {...rest}
    >
      {trigger}
      <span className="nui-tooltip__bubble" role="tooltip" id={id}>
        {content}
      </span>
    </span>
  )
}

export interface InfoTipProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'content'> {
  /** Required accessible name of the "i" button. */
  label: string
  /** Tooltip text; defaults to `label`. */
  content?: ReactNode
  side?: 'top' | 'bottom'
}

/** 15×15 round "i" button with a Tooltip. */
export function InfoTip({ label, content, side, className, ...rest }: InfoTipProps) {
  return (
    <Tooltip content={content ?? label} side={side}>
      <button type="button" className={cx('nui-infotip', className)} aria-label={label} {...rest}>
        <span aria-hidden="true">i</span>
      </button>
    </Tooltip>
  )
}
