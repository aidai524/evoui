import { useState, type HTMLAttributes, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { EyeIcon, EyeOffIcon } from '../../icons'
import { cx } from '../../utils/cx'

export interface SecretFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** The secret (API key, viewing key). */
  value: string
  /** Characters left visible at the end while hidden (default 4). */
  visibleTail?: number
  /** Accessible name of the value, e.g. "API key". */
  label?: string
  /** Initial reveal state. */
  defaultRevealed?: boolean
  /** Extra trailing actions (e.g. a CopyButton). */
  actions?: ReactNode
}

const MASK_LEN = 12

export function SecretField({ value, visibleTail = 4, label, defaultRevealed = false, actions, className, ...rest }: SecretFieldProps) {
  const { m } = useNuiLocale()
  const [revealed, setRevealed] = useState(defaultRevealed)
  const tail = visibleTail > 0 ? value.slice(-visibleTail) : ''
  return (
    <div className={cx('nui-secret', className)} data-revealed={revealed || undefined} {...rest}>
      <span className="nui-secret__value" title={revealed ? value : undefined}>
        {label && <span className="nui-sr-only">{label}: </span>}
        {revealed ? (
          value
        ) : (
          <>
            <span aria-hidden="true">{'•'.repeat(MASK_LEN)}</span>
            {tail}
          </>
        )}
      </span>
      {actions}
      <button
        type="button"
        className="nui-secret__toggle"
        aria-pressed={revealed}
        aria-label={revealed ? m.hide : m.reveal}
        title={revealed ? m.hide : m.reveal}
        onClick={() => setRevealed((r) => !r)}
      >
        {revealed ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
      </button>
    </div>
  )
}
