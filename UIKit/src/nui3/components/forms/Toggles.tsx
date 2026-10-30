import { useId, useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from '../../utils/cx'
import { useFieldControl } from './Field'

/* ───────────────────────── Switch ───────────────────────── */

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role'> {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  /** Required visible label, rendered as adjacent text. */
  label: ReactNode
  /** Visually hide the label text (still the accessible name). */
  hideLabel?: boolean
  ref?: Ref<HTMLButtonElement>
}

/** role=switch + aria-checked. On: accent track, on-accent knob moved 18px. */
export function Switch({ checked, defaultChecked = false, onChange, label, hideLabel, className, id, disabled, onClick, ref, ...rest }: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked)
  const on = checked ?? inner
  const auto = useId()
  const switchId = id ?? auto
  return (
    <span className={cx('nui-switch-field', className)} data-disabled={disabled || undefined}>
      <button
        ref={ref}
        type="button"
        role="switch"
        id={switchId}
        className="nui-switch"
        aria-checked={on}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e)
          if (e.defaultPrevented) return
          if (checked === undefined) setInner(!on)
          onChange?.(!on)
        }}
        {...rest}
      />
      <label htmlFor={switchId} className={hideLabel ? 'nui-sr-only' : 'nui-switch-field__label'}>
        {label}
      </label>
    </span>
  )
}

/* ───────────────────────── Checkbox ───────────────────────── */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text (or pass children). */
  label?: ReactNode
  invalid?: boolean
  ref?: Ref<HTMLInputElement>
}

export function Checkbox({ label, invalid, className, children, id, disabled, 'aria-describedby': db, 'aria-invalid': ai, ref, ...rest }: CheckboxProps) {
  const f = useFieldControl({ id, invalid, 'aria-describedby': db, 'aria-invalid': ai })
  return (
    <label className={cx('nui-check', className)} data-disabled={(disabled ?? f.disabled) || undefined}>
      <input
        ref={ref}
        type="checkbox"
        id={f.id}
        aria-describedby={f['aria-describedby']}
        aria-invalid={f['aria-invalid']}
        disabled={disabled ?? f.disabled}
        {...rest}
      />
      <span>{label ?? children}</span>
    </label>
  )
}

/* ───────────────────────── Slider ───────────────────────── */

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max' | 'step'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Clickable tick values shown under the track. */
  marks?: number[]
  /** Formats aria-valuetext and mark labels (e.g. v => `${v}×`). */
  format?: (value: number) => string
  /** Accessible name (aria-label). Optional inside a Field, which labels it. */
  label?: string
  tone?: 'accent' | 'warning' | 'negative'
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  marks,
  format = String,
  label,
  tone = 'accent',
  className,
  style,
  id,
  disabled,
  'aria-describedby': db,
  ...rest
}: SliderProps) {
  const f = useFieldControl({ id, 'aria-describedby': db })
  const pct = (v: number) => (max === min ? 0 : ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100)
  const isDisabled = disabled ?? f.disabled
  return (
    <div
      className={cx('nui-slider', tone !== 'accent' && `nui-slider--${tone}`, className)}
      style={{ '--_pct': `${pct(value)}%`, ...style } as CSSProperties}
      data-disabled={isDisabled || undefined}
    >
      <input
        type="range"
        id={f.id}
        className="nui-slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-describedby={f['aria-describedby']}
        aria-valuetext={format(value)}
        disabled={isDisabled}
        onChange={(e) => onChange(Number(e.target.value))}
        {...rest}
      />
      {marks && marks.length > 0 && (
        <div className="nui-slider__marks">
          {marks.map((mk) => (
            <button
              key={mk}
              type="button"
              tabIndex={-1}
              className="nui-slider__mark"
              data-active={value >= mk || undefined}
              style={{ '--_at': pct(mk) / 100 } as CSSProperties}
              disabled={isDisabled}
              onClick={() => onChange(mk)}
            >
              {format(mk)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
