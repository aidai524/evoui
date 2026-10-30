import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { CheckIcon, CopyIcon } from '../../icons'
import { cx } from '../../utils/cx'

/** How long the copied state stays on (03 §4). */
export const COPIED_MS = 1500

async function writeClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

export interface UseCopyResult {
  copied: boolean
  copy: (value: string) => Promise<boolean>
}

/** `{ copied, copy }` — copied stays true for 1.5s after a successful copy. */
export function useCopy(timeout = COPIED_MS): UseCopyResult {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = useCallback(
    async (value: string) => {
      const ok = await writeClipboard(value)
      if (ok) {
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), timeout)
      }
      return ok
    },
    [timeout],
  )
  return { copied, copy }
}

export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onCopy'> {
  /** Full value written to the clipboard. */
  value: string
  /** Required accessible name, e.g. m.copyAddress. */
  label: string
  onCopy?: (value: string) => void
}

/** 24×24 icon button. Announces "Copied" through a polite live region. */
export function CopyButton({ value, label, onCopy, className, onClick, ...rest }: CopyButtonProps) {
  const { m } = useNuiLocale()
  const { copied, copy } = useCopy()
  return (
    <>
      <button
        type="button"
        className={cx('nui-copy', className)}
        aria-label={label}
        title={copied ? m.copied : label}
        data-copied={copied || undefined}
        onClick={async (e) => {
          onClick?.(e)
          if (e.defaultPrevented) return
          if (await copy(value)) onCopy?.(value)
        }}
        {...rest}
      >
        {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
      </button>
      <span className="nui-sr-only" aria-live="polite">
        {copied ? m.copied : ''}
      </span>
    </>
  )
}
