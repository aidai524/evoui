import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type AnimationEvent, type FocusEvent, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { CloseIcon } from '../../icons'
import { cx } from '../../utils/cx'
import { IconButton } from '../actions'

export type ToastTone = 'default' | 'positive' | 'negative'

export interface ToastOptions {
  title: ReactNode
  description?: ReactNode
  tone?: ToastTone
  /** ms before auto-dismiss. Default 5000; 0 or Infinity keeps it until dismissed. Paused while hovered or focused. */
  duration?: number
  /** Inline action, e.g. `<Button variant="underline" size="sm">View</Button>`. */
  action?: ReactNode
}

export interface ToastApi {
  /** Show a toast; returns its id. */
  toast: (opts: ToastOptions) => string
  dismiss: (id: string) => void
}

interface ToastEntry extends ToastOptions {
  id: string
  /** true while the exit animation runs (still rendered, no longer counted). */
  leaving?: boolean
}

interface Timer {
  handle?: ReturnType<typeof setTimeout>
  remaining: number
  startedAt: number
}

const ToastContext = createContext<ToastApi | null>(null)

let warned = false
const noop: ToastApi = {
  toast: () => {
    if (!warned && typeof console !== 'undefined') console.warn('[nui3] useToast() called outside <ToastProvider>; toasts are dropped.')
    warned = true
    return ''
  },
  dismiss: () => {},
}

/** `{ toast, dismiss }`. Transaction results must go through toast, not inline success notices. */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? noop
}

export interface ToastProviderProps {
  children?: ReactNode
  /** Max toasts shown at once (oldest drop first). Default 4. */
  limit?: number
}

/** Exit = toast fade/slide (dur-fast) then slot collapse (dur-instant delay + dur-fast); remove anyway after this. */
const EXIT_TIMEOUT = 700

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

let seq = 0

export function ToastProvider({ children, limit = 4 }: ToastProviderProps) {
  const { m } = useNuiLocale()
  const [items, setItems] = useState<ToastEntry[]>([])
  // Synchronous mirror of `items` so toast()/dismiss() can read the current stack outside render.
  const list = useRef<ToastEntry[]>([])
  const commit = useCallback((next: ToastEntry[]) => {
    list.current = next
    setItems(next)
  }, [])
  const timers = useRef(new Map<string, Timer>())
  const removals = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const paused = useRef({ hover: false, focus: false })
  const toasterRef = useRef<HTMLDivElement>(null)

  const remove = useCallback(
    (id: string) => {
      const r = removals.current.get(id)
      if (r) clearTimeout(r)
      removals.current.delete(id)
      if (list.current.some((x) => x.id === id)) commit(list.current.filter((x) => x.id !== id))
    },
    [commit],
  )

  const dismiss = useCallback(
    (id: string) => {
      const t = timers.current.get(id)
      if (t?.handle) clearTimeout(t.handle)
      timers.current.delete(id)
      if (reducedMotion()) {
        remove(id)
        return
      }
      if (!list.current.some((x) => x.id === id && !x.leaving)) return
      commit(list.current.map((x) => (x.id === id ? { ...x, leaving: true } : x)))
      removals.current.set(id, setTimeout(() => remove(id), EXIT_TIMEOUT))
    },
    [commit, remove],
  )

  const start = useCallback(
    (id: string, t: Timer) => {
      t.startedAt = Date.now()
      t.handle = setTimeout(() => dismiss(id), t.remaining)
    },
    [dismiss],
  )

  const syncPause = useCallback(() => {
    const p = paused.current.hover || paused.current.focus
    timers.current.forEach((t, id) => {
      if (p && t.handle) {
        clearTimeout(t.handle)
        t.handle = undefined
        t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt))
      } else if (!p && !t.handle) start(id, t)
    })
  }, [start])

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = `nui-toast-${++seq}`
      const live = list.current.filter((x) => !x.leaving)
      commit([...list.current, { ...opts, id }])
      // Over the limit: the oldest leave with the normal exit animation.
      live.slice(0, Math.max(0, live.length + 1 - limit)).forEach((x) => dismiss(x.id))
      const d = opts.duration ?? 5000
      if (d > 0 && Number.isFinite(d)) {
        const t: Timer = { remaining: d, startedAt: Date.now() }
        timers.current.set(id, t)
        if (!paused.current.hover && !paused.current.focus) start(id, t)
      }
      return id
    },
    [commit, dismiss, limit, start],
  )

  /* Hover pause. Tracked from document pointermove rather than mouseenter/leave: a toast removed from under a
     still pointer never reports mouseleave, which would otherwise leave the whole stack paused. */
  useEffect(() => {
    const el = toasterRef.current
    if (!el) return
    const set = (hover: boolean) => {
      if (hover === paused.current.hover) return
      paused.current.hover = hover
      syncPause()
    }
    const onMove = (e: PointerEvent) => e.pointerType !== 'touch' && set(el.contains(e.target as Node))
    const onOut = (e: PointerEvent) => e.relatedTarget === null && set(false) // pointer left the window
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
    }
  }, [syncPause])

  // After the stack changes, re-derive the pause from the DOM (a removed toast reports neither blur nor leave).
  useEffect(() => {
    const el = toasterRef.current
    if (!el) return
    const recheck = () => {
      const hover = items.some((x) => !x.leaving) && paused.current.hover && el.matches(':hover')
      const focus = el.contains(document.activeElement)
      if (hover === paused.current.hover && focus === paused.current.focus) return
      paused.current = { hover, focus }
      syncPause()
    }
    // Hover state is refreshed by the browser on the next frame after layout changes.
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(recheck)
    })
    return () => cancelAnimationFrame(raf)
  }, [items, syncPause])

  useEffect(() => {
    const map = timers.current
    const rm = removals.current
    return () => {
      map.forEach((t) => t.handle && clearTimeout(t.handle))
      rm.forEach(clearTimeout)
    }
  }, [])

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  const onSlotAnimationEnd = (id: string) => (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.animationName === 'nui-collapse-out') remove(id)
  }
  const onFocus = () => {
    paused.current.focus = true
    syncPause()
  }
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    paused.current.focus = false
    syncPause()
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        ref={toasterRef}
        className="nui-toaster"
        role="region"
        aria-live="polite"
        aria-label={m.notifications}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {items.map((t) => {
          const tone = t.tone ?? 'default'
          return (
            <div
              key={t.id}
              className="nui-toast-slot"
              data-state={t.leaving ? 'closed' : 'open'}
              aria-hidden={t.leaving || undefined}
              onAnimationEnd={onSlotAnimationEnd(t.id)}
            >
              <div className="nui-toast-slot__inner">
                <div className={cx('nui-toast', tone !== 'default' && `nui-toast--${tone}`)} role={tone === 'negative' ? 'alert' : 'status'}>
                  <div className="nui-toast__content">
                    <p className="nui-toast__title">{t.title}</p>
                    {t.description !== undefined && <p className="nui-toast__desc">{t.description}</p>}
                    {t.action !== undefined && <div className="nui-toast__action">{t.action}</div>}
                  </div>
                  <IconButton size="sm" label={m.dismiss} tabIndex={t.leaving ? -1 : undefined} onClick={() => dismiss(t.id)}>
                    <CloseIcon />
                  </IconButton>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
