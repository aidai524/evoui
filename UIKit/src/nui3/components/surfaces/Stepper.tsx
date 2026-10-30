import type { HTMLAttributes, ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export type StepState = 'pending' | 'active' | 'complete' | 'error'

export interface StepperStep {
  title: ReactNode
  description?: ReactNode
  state: StepState
}

export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
  steps: StepperStep[]
  /** Columns with a horizontal connector (falls back to vertical ≤640px). */
  horizontal?: boolean
}

const MARK: Record<StepState, string> = { pending: '', active: '', complete: '✓', error: '!' }

export function Stepper({ steps, horizontal, className, ...rest }: StepperProps) {
  const { m } = useNuiLocale()
  const stateText: Record<StepState, string> = { pending: m.stepPending, active: m.stepActive, complete: m.stepComplete, error: m.stepError }
  return (
    <ol className={cx('nui-stepper', horizontal && 'nui-stepper--horizontal', className)} {...rest}>
      {steps.map((s, i) => (
        <li key={i} className="nui-step" data-state={s.state} aria-current={s.state === 'active' ? 'step' : undefined}>
          <span className="nui-step__marker" aria-hidden="true">
            {MARK[s.state]}
          </span>
          <div className="nui-step__text">
            <p className="nui-step__title">
              {s.title}
              <span className="nui-sr-only"> ({stateText[s.state]})</span>
            </p>
            {s.description != null && <p className="nui-step__desc">{s.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
