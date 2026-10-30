import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { CheckIcon, CopyIcon } from '../../icons'
import { cx } from '../../utils/cx'

export interface CodeSnippet {
  label: string
  code: string
  language?: string
}

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Single snippet. Ignored when `snippets` is given. */
  code?: string
  /** Tabbed snippets (npm / pnpm / yarn…). */
  snippets?: CodeSnippet[]
  title?: ReactNode
  language?: string
  copyable?: boolean
}

/** Inverse-surface code block with optional tabs and an inline copy action (announces "Copied"). */
export function CodeBlock({ code = '', snippets, title, language, copyable = true, className, ...rest }: CodeBlockProps) {
  const { m } = useNuiLocale()
  const id = useId()
  const [tab, setTab] = useState(0)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const tabsRef = useRef<HTMLDivElement>(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const hasTabs = !!snippets?.length
  const active = hasTabs ? snippets![Math.min(tab, snippets!.length - 1)] : undefined
  const text = active ? active.code : code
  const lang = active?.language ?? language

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!snippets) return
    const n = snippets.length
    let next = -1
    if (e.key === 'ArrowRight') next = (tab + 1) % n
    else if (e.key === 'ArrowLeft') next = (tab - 1 + n) % n
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    if (next < 0) return
    e.preventDefault()
    setTab(next)
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  const showHead = title != null || lang || hasTabs || copyable
  return (
    <div className={cx('nui-code', className)} {...rest}>
      {showHead && (
        <div className="nui-code__head">
          {hasTabs ? (
            <div className="nui-code__tabs" role="tablist" aria-label={typeof title === 'string' ? title : undefined} ref={tabsRef} onKeyDown={onTabKey}>
              {snippets!.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  role="tab"
                  id={`${id}-t${i}`}
                  aria-controls={`${id}-p`}
                  aria-selected={i === tab}
                  tabIndex={i === tab ? 0 : -1}
                  className="nui-code__tab"
                  onClick={() => setTab(i)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="nui-code__title">
              {title}
              {title != null && lang ? ' · ' : null}
              {lang}
            </span>
          )}
          {copyable && (
            <button type="button" className="nui-code__copy" onClick={copy} data-copied={copied || undefined}>
              {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              <span>{copied ? m.copied : m.copy}</span>
            </button>
          )}
        </div>
      )}
      <pre
        className="nui-code__pre"
        id={`${id}-p`}
        role={hasTabs ? 'tabpanel' : undefined}
        aria-labelledby={hasTabs ? `${id}-t${tab}` : undefined}
        tabIndex={0}
      >
        <code data-language={lang}>{text}</code>
      </pre>
      <span className="nui-sr-only" aria-live="polite">
        {copied ? m.copied : ''}
      </span>
    </div>
  )
}
