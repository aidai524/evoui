import { useId, useRef, useState, type DragEvent, type HTMLAttributes, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export interface FileDropProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrop'> {
  /** Accepted files (oversize / wrong type are filtered out). */
  onFiles: (files: File[]) => void
  /** Same syntax as `<input accept>`: ".csv,text/csv,image/*". */
  accept?: string
  /** Max bytes per file; larger files show `fileTooLarge`. */
  maxSize?: number
  multiple?: boolean
  /** Optional title above the drop line. */
  label?: ReactNode
  hint?: ReactNode
  disabled?: boolean
  /** External error (e.g. parse failure); sets data-invalid. */
  error?: ReactNode
}

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => (rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule))
}

export function FileDrop({ onFiles, accept, maxSize, multiple, label, hint, disabled, error, className, ...rest }: FileDropProps) {
  const { m } = useNuiLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [tooLarge, setTooLarge] = useState(false)
  const id = useId()
  const errId = `${id}-error`

  const take = (list: FileList | null) => {
    if (!list || disabled) return
    let files = Array.from(list).filter((f) => matchesAccept(f, accept))
    if (!multiple) files = files.slice(0, 1)
    const big = maxSize !== undefined && files.some((f) => f.size > maxSize)
    setTooLarge(big)
    const ok = maxSize !== undefined ? files.filter((f) => f.size <= maxSize) : files
    if (ok.length) onFiles(ok)
  }

  const drag = (e: DragEvent<HTMLDivElement>, state: boolean) => {
    e.preventDefault()
    if (!disabled) setOver(state)
  }

  const err = error ?? (tooLarge ? m.fileTooLarge : undefined)
  return (
    <div
      className={cx('nui-filedrop', className)}
      data-over={over || undefined}
      data-invalid={err ? true : undefined}
      data-disabled={disabled || undefined}
      onDragEnter={(e) => drag(e, true)}
      onDragOver={(e) => drag(e, true)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) drag(e, false)
      }}
      onDrop={(e) => {
        drag(e, false)
        take(e.dataTransfer.files)
      }}
      {...rest}
    >
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="file"
        className="nui-sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files)
          e.target.value = ''
        }}
      />
      {label !== undefined && <p className="nui-filedrop__label">{label}</p>}
      <p className={label !== undefined ? 'nui-filedrop__line' : 'nui-filedrop__label'}>
        {m.dropFiles}{' '}
        <button
          type="button"
          className="nui-filedrop__browse"
          disabled={disabled}
          aria-describedby={err ? errId : undefined}
          onClick={() => inputRef.current?.click()}
        >
          {m.browse}
        </button>
      </p>
      {hint !== undefined && <p className="nui-filedrop__hint">{hint}</p>}
      {err && (
        <p className="nui-filedrop__error" id={errId} role="alert">
          {err}
        </p>
      )}
    </div>
  )
}
