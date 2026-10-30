import { createContext, useContext, useId, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../utils/cx'

export interface FieldContextValue {
  /** id for the control (label `for` points here). */
  id: string
  /** id of the visible/visually-hidden label, for group controls that need aria-labelledby. */
  labelId: string
  /** hint id and/or error id, space-separated. */
  describedBy?: string
  invalid: boolean
  disabled?: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

/** Raw Field context (null outside a Field). */
export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext)
}

export interface FieldControlInput {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling'
  invalid?: boolean
}

export interface FieldControlProps {
  id: string | undefined
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
  /** Field label id (for aria-labelledby on group controls). */
  labelId: string | undefined
  invalid: boolean
  /** Field-level disabled flag (undefined outside a Field). */
  disabled: boolean | undefined
}

/**
 * Join a control to the surrounding `Field`: returns id / aria-describedby / aria-invalid merged with the
 * control's own props (own props win for id; describedby ids are concatenated; invalid is OR-ed).
 * Use it in any custom input (MemoInput, TokenAmountInput…) so it gets labelled and described automatically.
 */
export function useFieldControl(own: FieldControlInput = {}): FieldControlProps {
  const ctx = useContext(FieldContext)
  const ownInvalid = own.invalid || own['aria-invalid'] === true || own['aria-invalid'] === 'true'
  const invalid = Boolean(ownInvalid || ctx?.invalid)
  const describedBy = [ctx?.describedBy, own['aria-describedby']].filter(Boolean).join(' ') || undefined
  return {
    id: own.id ?? ctx?.id,
    'aria-describedby': describedBy,
    'aria-invalid': invalid || undefined,
    labelId: ctx?.labelId,
    invalid,
    disabled: ctx?.disabled,
  }
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode
  /** Right side of the label row (e.g. balance, byte counter). */
  labelAside?: ReactNode
  hint?: ReactNode
  /** Error text: role=alert, aria-invalid on the control, replaces the hint. */
  error?: ReactNode
  /** Visually hide the label (it stays in the accessibility tree). */
  hideLabel?: boolean
  /** Control id; generated when omitted. */
  id?: string
  disabled?: boolean
  children?: ReactNode
}

/** The only container allowed to wrap an input. Wires id, label, hint, error and aria-* into the child control. */
export function Field({ label, labelAside, hint, error, hideLabel, id, disabled, className, children, ...rest }: FieldProps) {
  const auto = useId()
  const controlId = id ?? `${auto}-control`
  const labelId = `${auto}-label`
  const hintId = `${auto}-hint`
  const errorId = `${auto}-error`
  const hasError = error !== undefined && error !== null && error !== false && error !== ''
  const showHint = !hasError && hint !== undefined && hint !== null && hint !== false
  const describedBy = [showHint && hintId, hasError && errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={cx('nui-field', className)} data-invalid={hasError || undefined} data-disabled={disabled || undefined} {...rest}>
      {hideLabel ? (
        <label className="nui-sr-only" id={labelId} htmlFor={controlId}>
          {label}
        </label>
      ) : (
        <div className="nui-field__top">
          <label className="nui-field__label" id={labelId} htmlFor={controlId}>
            {label}
          </label>
          {labelAside !== undefined && <span className="nui-field__aside">{labelAside}</span>}
        </div>
      )}
      <FieldContext.Provider value={{ id: controlId, labelId, describedBy, invalid: hasError, disabled }}>{children}</FieldContext.Provider>
      {showHint && (
        <p className="nui-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {hasError && (
        <p className="nui-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
