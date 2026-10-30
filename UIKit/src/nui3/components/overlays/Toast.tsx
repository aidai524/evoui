import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { CloseIcon } from '../../icons'
import { cx } from '../../utils/cx'
import { IconButton } from '../actions'

export type ToastTone = 'default' | 'positive' | 'negative'

export interface ToastOptions {
  title: ReactNode
  description?: ReactNode
  tone?: ToastTone
  /** ms before auto-dismiss. Default 5000; 0 or Infinity keeps it until dismissed. */
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

let seq = 0

export function ToastProvider({ children, limit = 4 }: ToastProviderProps) {
  const { m } = useNuiLocale()
  const [items, setItems] = useState<ToastEntry[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
    setItems((xs) => xs.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = `nui-toast-${++seq}`
      setItems((xs) => [...xs, { ...opts, id }].slice(-limit))
      const d = opts.duration ?? 5000
      if (d > 0 && Number.isFinite(d)) timers.current.set(id, setTimeout(() => dismiss(id), d))
      return id
    },
    [dismiss, limit],
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach(clearTimeout)
  }, [])

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="nui-toaster" role="region" aria-live="polite" aria-label={m.notifications}>
        {items.map((t) => {
          const tone = t.tone ?? 'default'
          return (
            <div key={t.id} className={cx('nui-toast', tone !== 'default' && `nui-toast--${tone}`)} role={tone === 'negative' ? 'alert' : 'status'}>
              <div className="nui-toast__content">
                <p className="nui-toast__title">{t.title}</p>
                {t.description !== undefined && <p className="nui-toast__desc">{t.description}</p>}
                {t.action !== undefined && <div className="nui-toast__action">{t.action}</div>}
              </div>
              <IconButton size="sm" label={m.dismiss} onClick={() => dismiss(t.id)}>
                <CloseIcon />
              </IconButton>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
