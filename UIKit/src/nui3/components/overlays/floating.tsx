// Floating-layer primitives shared by Tooltip, Select, Menu, DatePicker and Popover:
// a theme-aware Portal, a presence hook that keeps content mounted for its exit animation,
// anchored positioning (flip / shift / size via @floating-ui) and outside-click / Esc dismissal.
import {
  autoUpdate,
  flip,
  offset as offsetMw,
  shift,
  size,
  useFloating,
  type Placement,
} from '@floating-ui/react-dom'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../utils/cx'

export type { Placement }

/* ───────────────────────── Portal ───────────────────────── */

const SCOPE_ATTRS = ['data-nui-theme', 'data-nui-density'] as const

/** Copies theme / density / token overrides from the nearest themed ancestor of `from`, so portaled UI keeps a ThemeProvider's look. */
function mirrorScope(target: HTMLElement, from: Element | null | undefined) {
  const scope = from?.closest('[data-nui-theme]') as HTMLElement | null | undefined
  for (const a of SCOPE_ATTRS) {
    const v = scope?.getAttribute(a)
    if (v) target.setAttribute(a, v)
    else target.removeAttribute(a)
  }
  target.style.cssText = scope && scope !== document.documentElement ? scope.style.cssText : ''
}

export interface PortalProps {
  children: ReactNode
  /** Element whose theme scope the portal inherits (usually the trigger). */
  scope?: RefObject<Element | null>
  /** Render target; defaults to a fresh `<div class="nui-portal">` on document.body. */
  container?: HTMLElement | null
}

/** Renders children at the end of <body> (escapes overflow:hidden / stacking contexts) while keeping the theme of `scope`. */
export function Portal({ children, scope, container }: PortalProps) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (container) {
      setHost(container)
      return
    }
    const el = document.createElement('div')
    el.className = 'nui-portal'
    document.body.appendChild(el)
    setHost(el)
    return () => el.remove()
  }, [container])
  useLayoutEffect(() => {
    if (host && !container) mirrorScope(host, scope?.current)
  })
  return host ? createPortal(children, host) : null
}

/* ───────────────────────── Presence ───────────────────────── */

export type PresenceState = 'open' | 'closed'

/**
 * Keeps content mounted until its exit animation ends.
 * Returns `mounted` (render or not) and `state` (put on `data-state` so CSS can animate in and out).
 * Pass the element ref so the hook can wait for `animationend`; falls back to `timeout` ms.
 */
export function usePresence(open: boolean, ref?: RefObject<HTMLElement | null>, timeout = 400): { mounted: boolean; state: PresenceState } {
  const [mounted, setMounted] = useState(open)
  const [state, setState] = useState<PresenceState>(open ? 'open' : 'closed')

  useLayoutEffect(() => {
    if (open) {
      setMounted(true)
      setState('open')
      return
    }
    setState('closed')
  }, [open])

  useEffect(() => {
    if (open || !mounted) return
    const el = ref?.current
    const done = () => setMounted(false)
    const animated = el && getComputedStyle(el).animationName !== 'none' && !matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!animated) {
      done()
      return
    }
    const t = window.setTimeout(done, timeout)
    const onEnd = (e: AnimationEvent) => e.target === el && done()
    el.addEventListener('animationend', onEnd)
    return () => {
      clearTimeout(t)
      el.removeEventListener('animationend', onEnd)
    }
  }, [open, mounted, ref, timeout])

  return { mounted, state }
}

/* ───────────────────────── Dismiss ───────────────────────── */

/** Calls `onDismiss` on Esc or a pointerdown outside every element in `inside`. */
export function useDismiss(open: boolean, inside: RefObject<Element | null>[], onDismiss: (reason: 'escape' | 'outside') => void) {
  const cb = useRef(onDismiss)
  cb.current = onDismiss
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (inside.some((r) => r.current?.contains(t))) return
      cb.current('outside')
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      e.preventDefault()
      cb.current('escape')
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ───────────────────────── Anchored positioning ───────────────────────── */

export interface AnchoredOptions {
  open: boolean
  placement?: Placement
  /** Gap between anchor and panel in px (default 6). */
  offset?: number
  /** 'width' sets the panel width to the anchor's; 'min' sets min-width. */
  matchWidth?: boolean | 'min'
  /** Cap the panel height to the available viewport space (default true). */
  fitViewport?: boolean
}

/** @floating-ui wrapper: fixed strategy, flip + shift + size, auto-updates while open. */
export function useAnchored({ open, placement = 'bottom-start', offset = 6, matchWidth, fitViewport = true }: AnchoredOptions) {
  const f = useFloating({
    open,
    placement,
    strategy: 'fixed',
    // top/left instead of transform: the enter/exit keyframes own `transform`.
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offsetMw(offset),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, availableHeight, elements }) {
          const s = elements.floating.style
          if (matchWidth === true) s.width = `${rects.reference.width}px`
          else if (matchWidth === 'min') s.minWidth = `${rects.reference.width}px`
          if (fitViewport) s.setProperty('--nui-floating-max-h', `${Math.max(120, availableHeight)}px`)
        },
      }),
    ],
  })
  const side = f.placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right'
  return { ...f, side }
}

/* ───────────────────────── FloatingPanel ───────────────────────── */

export interface FloatingPanelProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean
  /** The element the panel is anchored to. */
  anchor: RefObject<HTMLElement | null>
  placement?: Placement
  offset?: number
  matchWidth?: boolean | 'min'
  /** Called on Esc / outside pointerdown. Omit to manage dismissal yourself. */
  onDismiss?: (reason: 'escape' | 'outside') => void
  /** Return focus to the anchor after an Esc dismissal (default true). */
  returnFocus?: boolean
  /** Visual style: raised surface (default) or inverse bubble (tooltips). */
  variant?: 'surface' | 'inverse'
  ref?: RefObject<HTMLDivElement | null>
}

/**
 * Portaled, anchored, animated panel. `data-state="open|closed"` drives the enter/exit animation,
 * `data-side` the direction it grows from. Building block for Popover, Select, Menu, DatePicker, Tooltip.
 */
export function FloatingPanel({
  open,
  anchor,
  placement,
  offset,
  matchWidth,
  onDismiss,
  returnFocus = true,
  variant = 'surface',
  className,
  style,
  children,
  ref,
  ...rest
}: FloatingPanelProps) {
  const own = useRef<HTMLDivElement | null>(null)
  const panelRef = ref ?? own
  const { mounted, state } = usePresence(open, panelRef)
  const { refs, floatingStyles, side } = useAnchored({ open: mounted, placement, offset, matchWidth })

  useLayoutEffect(() => {
    refs.setReference(anchor.current)
  }, [anchor, refs, mounted])

  useDismiss(open && !!onDismiss, [panelRef, anchor], (reason) => {
    onDismiss?.(reason)
    if (reason === 'escape' && returnFocus) anchor.current?.focus()
  })

  if (!mounted) return null
  return (
    <Portal scope={anchor}>
      <div
        ref={(node) => {
          panelRef.current = node
          refs.setFloating(node)
        }}
        className={cx('nui-floating', variant === 'inverse' && 'nui-floating--inverse', className)}
        data-state={state}
        data-side={side}
        style={{ ...floatingStyles, ...style } as CSSProperties}
        {...rest}
      >
        {children}
      </div>
    </Portal>
  )
}

/* ───────────────────────── Popover ───────────────────────── */

export interface PopoverProps extends Omit<FloatingPanelProps, 'open' | 'anchor' | 'onDismiss' | 'content'> {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Anchor element ref (the trigger button). */
  anchor: RefObject<HTMLElement | null>
  /** Accessible name when the content has no heading. */
  label?: string
}

/** Non-modal dialog anchored to a trigger: role=dialog, closes on Esc / outside click, focus returns to the trigger. */
export function Popover({ open, onOpenChange, anchor, label, className, children, ...rest }: PopoverProps) {
  return (
    <FloatingPanel
      open={open}
      anchor={anchor}
      onDismiss={() => onOpenChange(false)}
      role="dialog"
      aria-label={label}
      className={cx('nui-popover', className)}
      {...rest}
    >
      {children}
    </FloatingPanel>
  )
}
