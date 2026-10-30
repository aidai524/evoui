import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'
import { cx } from '../../utils/cx'
import { FloatingPanel, type Placement } from '../overlays/floating'

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right'
export type TooltipAlign = 'start' | 'center' | 'end'

export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'content'> {
  content: ReactNode
  /** Preferred side (default 'top'); flips and shifts automatically to stay in the viewport. */
  side?: TooltipSide
  /** Alias of `side`; wins when both are given. */
  placement?: TooltipSide
  /** Alignment along the side (default 'center'). */
  align?: TooltipAlign
  /** Small pointer towards the trigger. */
  arrow?: boolean
  /** Hover delay before opening, ms (default 120). Skipped while another tooltip is open or just closed. */
  delay?: number
  /** Delay before closing after the pointer leaves, ms (default 80). */
  closeDelay?: number
  /** Controlled open state. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Never show. */
  disabled?: boolean
  /** The trigger. A single element gets `aria-describedby` wired automatically; a disabled one is wrapped so it still gets the tooltip. */
  children: ReactNode
}

/* Hover intent shared by every tooltip: once one is open (or closed < WARM_MS ago), the next opens instantly. */
const WARM_MS = 300
let current: { close: () => void } | null = null
let lastClosed = 0

type TriggerProps = { 'aria-describedby'?: string; disabled?: boolean; 'aria-disabled'?: boolean | 'true' | 'false' }

/**
 * Inverse bubble portaled to <body> (never clipped by overflow:hidden). Opens on hover (after `delay`) and on keyboard
 * focus (focus-visible, not mouse-click focus); tap toggles on touch. Esc or an outside press closes it.
 */
export function Tooltip({
  content,
  side,
  placement,
  align = 'center',
  arrow = false,
  delay = 120,
  closeDelay = 80,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled,
  children,
  className,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  ...rest
}: TooltipProps) {
  const id = useId()
  const anchor = useRef<HTMLSpanElement>(null)
  const [inner, setInner] = useState(defaultOpen)
  const open = !disabled && (openProp ?? inner)
  const openRef = useRef(open)
  const changeRef = useRef(onOpenChange)
  const timer = useRef<number | undefined>(undefined)

  const set = (v: boolean) => {
    window.clearTimeout(timer.current)
    if (v === openRef.current) return
    openRef.current = v
    setInner(v)
    changeRef.current?.(v)
  }
  const setRef = useRef(set)
  // Latest values for timers and the shared hover-intent registry.
  useLayoutEffect(() => {
    openRef.current = open
    changeRef.current = onOpenChange
    setRef.current = set
  })

  const show = (instant = false) => {
    window.clearTimeout(timer.current)
    if (openRef.current || disabled) return
    const warm = current != null || performance.now() - lastClosed < WARM_MS
    if (instant || warm || delay <= 0) set(true)
    else timer.current = window.setTimeout(() => setRef.current(true), delay)
  }
  const hide = (instant = false) => {
    window.clearTimeout(timer.current)
    if (!openRef.current) return
    if (instant || closeDelay <= 0) set(false)
    else timer.current = window.setTimeout(() => setRef.current(false), closeDelay)
  }

  // Only one tooltip at a time; remember when the last one closed for the warm-up skip.
  useEffect(() => {
    if (!open) return
    const me = { close: () => setRef.current(false) }
    if (current) current.close()
    current = me
    return () => {
      if (current !== me) return
      current = null
      lastClosed = performance.now()
    }
  }, [open])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const el = isValidElement(children) ? (children as ReactElement<TriggerProps>) : null
  const triggerDisabled = !!el && (el.props.disabled === true || el.props['aria-disabled'] === true || el.props['aria-disabled'] === 'true')
  const describedBy = (prev?: string) => cx(prev, id) || undefined
  const trigger = el && !triggerDisabled ? cloneElement(el, { 'aria-describedby': describedBy(el.props['aria-describedby']) }) : children

  const s = placement ?? side ?? 'top'
  const floatingPlacement = (align === 'center' ? s : `${s}-${align}`) as Placement

  return (
    <span
      ref={anchor}
      className={cx('nui-tooltip', className)}
      // A disabled control cannot take focus or pointer events: the wrapper takes both instead.
      tabIndex={triggerDisabled ? 0 : undefined}
      aria-describedby={triggerDisabled ? id : undefined}
      onPointerEnter={(e: PointerEvent<HTMLSpanElement>) => {
        if (e.pointerType !== 'touch') show()
        onPointerEnter?.(e)
      }}
      onPointerLeave={(e: PointerEvent<HTMLSpanElement>) => {
        if (e.pointerType !== 'touch') hide()
        onPointerLeave?.(e)
      }}
      onPointerDown={(e: PointerEvent<HTMLSpanElement>) => {
        if (e.pointerType === 'touch') {
          if (openRef.current) hide(true)
          else show(true)
        }
        onPointerDown?.(e)
      }}
      onFocus={(e: FocusEvent<HTMLSpanElement>) => {
        let visible = true
        try {
          visible = e.target.matches(':focus-visible')
        } catch {
          /* old engines: treat every focus as keyboard focus */
        }
        if (visible) show()
        onFocus?.(e)
      }}
      onBlur={(e: FocusEvent<HTMLSpanElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide(true)
        onBlur?.(e)
      }}
      {...rest}
    >
      {trigger}
      {/* Description stays resolvable for aria-describedby while the bubble is closed. */}
      {!open && (
        <span id={id} hidden>
          {content}
        </span>
      )}
      <FloatingPanel
        open={open}
        anchor={anchor}
        placement={floatingPlacement}
        offset={8}
        variant="inverse"
        returnFocus={false}
        onDismiss={() => set(false)}
        className="nui-tooltip__content"
        role="tooltip"
        id={open ? id : undefined}
        onPointerEnter={() => window.clearTimeout(timer.current)}
        onPointerLeave={(e) => e.pointerType !== 'touch' && hide()}
      >
        {content}
        {arrow && <TooltipArrow anchor={anchor} />}
      </FloatingPanel>
    </span>
  )
}

/** Keeps the arrow pointing at the trigger centre after flip / shift (re-measured whenever floating-ui moves the panel). */
function TooltipArrow({ anchor }: { anchor: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const node = ref.current
    const panel = node?.parentElement
    if (!node || !panel) return
    const place = () => {
      const a = anchor.current?.getBoundingClientRect()
      if (!a || !panel.style.left) return // not positioned yet: keep the centred default
      // Read the untransformed geometry: the enter animation scales/translates the panel.
      const vertical = panel.dataset.side === 'left' || panel.dataset.side === 'right'
      const start = parseFloat(vertical ? panel.style.top : panel.style.left) || 0
      const length = vertical ? panel.offsetHeight : panel.offsetWidth
      const centre = vertical ? a.top + a.height / 2 : a.left + a.width / 2
      node.style.setProperty('--nui-tooltip-arrow', `${Math.min(length - 8, Math.max(8, centre - start))}px`)
    }
    place()
    const mo = new MutationObserver(place)
    mo.observe(panel, { attributes: true, attributeFilter: ['style', 'data-side'] })
    return () => mo.disconnect()
  }, [anchor])
  return <span ref={ref} className="nui-tooltip__arrow" aria-hidden="true" />
}

export interface InfoTipProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'content'> {
  /** Required accessible name of the "i" button. */
  label: string
  /** Tooltip text; defaults to `label`. */
  content?: ReactNode
  side?: TooltipSide
  align?: TooltipAlign
  arrow?: boolean
}

/** 15×15 round "i" button with a Tooltip. */
export function InfoTip({ label, content, side, align, arrow, className, ...rest }: InfoTipProps) {
  return (
    <Tooltip content={content ?? label} side={side} align={align} arrow={arrow}>
      <button type="button" className={cx('nui-infotip', className)} aria-label={label} {...rest}>
        <span aria-hidden="true">i</span>
      </button>
    </Tooltip>
  )
}
