import type { CSSProperties, ReactNode } from 'react'
import { nearblocks } from '../lib/config'
import { shortHex } from '../lib/format'
import { useTween } from '../lib/hooks'
import type { TxResult } from '../lib/types'

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>
}

export function Panel(props: { title: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section className={`panel ${props.className ?? ''}`} id={props.id}>
      <header className="panel-head">
        <h3>{props.title}</h3>
        {props.actions}
      </header>
      <div className="panel-body">{props.children}</div>
    </section>
  )
}

type Tone = 'accent' | 'positive' | 'negative' | 'neutral' | 'lime' | 'outline'

export function Badge({ tone = 'neutral', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span className={`badge badge-${tone}`} title={title}>
      {children}
    </span>
  )
}

/** A number that counts to its new value (from 0 on mount), shown through `format`. */
export function Tween({ value, format }: { value: number; format: (n: number) => string }) {
  return <>{format(useTween(value))}</>
}

/** Particle drift (px) and delay (s) for the live meter head; fixed so every bar sparks the same way. */
const SPARKS = [
  [24, -12, 0],
  [34, 5, 0.25],
  [18, 11, 0.5],
  [40, -4, 0.75],
  [26, -16, 1],
  [20, 14, 1.25],
  [36, 9, 1.5],
  [30, -9, 1.75],
] as const

/** `live`: the fill grows in on mount and sparks drift off its leading edge (an open, trading curve). */
export function Meter({ value, label, size, live }: { value: number; label: string; size?: 'lg'; live?: boolean }) {
  const pct = Math.max(0, Math.min(1, value))
  const full = pct >= 1
  const sparking = live && pct > 0 && !full
  return (
    <div
      className={`meter ${full ? 'meter-positive' : ''} ${size === 'lg' ? 'meter-lg' : ''} ${live ? 'meter-live' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <div className="meter-fill" style={{ width: `${pct * 100}%` }} />
      {sparking && (
        <span className="meter-head" style={{ left: `${pct * 100}%` }} aria-hidden="true">
          {SPARKS.map(([dx, dy, d], i) => (
            <i key={i} style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${0.9 + d}s` } as CSSProperties} />
          ))}
        </span>
      )}
    </div>
  )
}

export function Notice({ tone, tag, children }: { tone?: 'success' | 'warning' | 'error'; tag?: string; children: ReactNode }) {
  const cls = tone === 'error' ? 'callout-error' : tone ? `notice-${tone}` : ''
  const defaultTag = tone === 'success' ? 'OK' : tone === 'warning' ? 'WARN' : tone === 'error' ? 'ERR' : 'INFO'
  return (
    <div className={`notice ${cls}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span className="notice-tag">{tag ?? defaultTag}</span>
      <div className="notice-body">{children}</div>
    </div>
  )
}

export function ErrorCallout({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <Notice tone="error">
      <div className="row between">
        <span className="break">{error.message}</span>
        {onRetry && (
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>
            RETRY
          </button>
        )}
      </div>
    </Notice>
  )
}

export function TxNotice({ result, children }: { result: TxResult; children?: ReactNode }) {
  return (
    <Notice tone="success" tag="TX OK">
      <div className="stack" style={{ ['--gap' as string]: '4px' }}>
        {result.detail && <div>{result.detail}</div>}
        {result.hash && (
          <div className="tiny">
            HASH{' '}
            <a href={nearblocks.tx(result.hash)} target="_blank" rel="noreferrer">
              {shortHex(result.hash, 8)} ↗
            </a>
          </div>
        )}
        {children}
      </div>
    </Notice>
  )
}

export function Reading({ label = 'READING' }: { label?: string }) {
  return <span className="reading">{label}…</span>
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="row between">
        <div className="skeleton" style={{ width: 140, height: 22 }} />
        <div className="skeleton" style={{ width: 60, height: 18 }} />
      </div>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton skeleton-line" style={{ width: `${90 - i * 15}%` }} />
      ))}
      <div className="skeleton" style={{ height: 8 }} />
    </div>
  )
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <Eyebrow>EMPTY</Eyebrow>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function DataCell({ label, value, sub, title }: { label: string; value: ReactNode; sub?: ReactNode; title?: string }) {
  return (
    <div className="data-cell">
      <div className="data-label">{label}</div>
      <div className="data-value" title={title}>
        {value}
      </div>
      {sub && <div className="data-sub">{sub}</div>}
    </div>
  )
}

export function Field(props: { label: string; htmlFor: string; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string }) {
  return (
    <div className={`field ${props.className ?? ''}`}>
      <label className="field-label" htmlFor={props.htmlFor}>
        {props.label}
      </label>
      {props.children}
      {props.error ? (
        <span className="field-error" id={`${props.htmlFor}-err`}>
          ! {props.error}
        </span>
      ) : (
        props.hint && <span className="field-hint">{props.hint}</span>
      )}
    </div>
  )
}

export function Toggle({ id, checked, onChange, label, sub }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
      <span>
        <span className="segment-title">{label}</span>
        {sub && <span className="segment-sub" style={{ display: 'block' }}>{sub}</span>}
      </span>
    </label>
  )
}

export function Segmented<T extends string>(props: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; title: string; sub?: string }[]
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={props.label}>
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={props.value === o.value}
          className="segment"
          onClick={() => props.onChange(o.value)}
        >
          <span className="segment-title">{o.title}</span>
          {o.sub && <span className="segment-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  )
}

export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
