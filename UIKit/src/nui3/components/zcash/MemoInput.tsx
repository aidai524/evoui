import { useId } from 'react'
import { useNuiLocale } from '../../i18n'
import { parseAddress } from '../../utils/address'
import { cx } from '../../utils/cx'
import { MEMO_MAX_BYTES, memoByteLength } from '../../utils/memo'
import { Textarea, useFieldControl, type TextareaProps } from '../forms'

export interface MemoInputProps extends Omit<TextareaProps, 'value' | 'onChange' | 'mono'> {
  value: string
  onChange: (value: string) => void
  /** Recipient address; a transparent / TEX recipient disables the memo. */
  recipient?: string
  maxBytes?: number
}

/** Memo textarea with a UTF-8 byte counter. Over the limit it is flagged (data-over, aria-invalid) but never truncated. */
export function MemoInput({ value, onChange, recipient, maxBytes = MEMO_MAX_BYTES, className, disabled, placeholder, invalid, rows = 3, 'aria-describedby': describedBy, ...rest }: MemoInputProps) {
  const { m, number } = useNuiLocale()
  const uid = useId()
  const field = useFieldControl()
  const parsed = recipient ? parseAddress(recipient) : null
  const blocked = !!parsed && !parsed.shielded
  const used = memoByteLength(value)
  const over = used > maxBytes
  const countId = `${uid}-count`
  const noteId = `${uid}-note`
  return (
    <div className={cx('nui-memo', className)} data-disabled={blocked || disabled || undefined}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={blocked ? m.memoTransparent : (placeholder ?? m.memoPlaceholder)}
        disabled={blocked || disabled || field.disabled}
        invalid={over || invalid}
        aria-describedby={cx(blocked ? noteId : countId, describedBy)}
        spellCheck={false}
        {...rest}
      />
      {blocked ? (
        <span className="nui-sr-only" id={noteId}>
          {m.memoTransparent}
        </span>
      ) : (
        <span className="nui-memo__count" id={countId} data-over={over || undefined}>
          {number(used)}/{number(maxBytes)} {m.bytes}
        </span>
      )}
    </div>
  )
}
