import type { ButtonHTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { SwapIcon } from '../../icons'
import { cx } from '../../utils/cx'

export interface SwapSwitchProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; defaults to m.switchTokens. */
  label?: string
}

/** 36×36 switch that sits between two TokenAmountInputs; rotates 180° on hover. */
export function SwapSwitch({ label, className, ...rest }: SwapSwitchProps) {
  const { m } = useNuiLocale()
  return (
    <button type="button" className={cx('nui-swap-switch', className)} aria-label={label ?? m.switchTokens} {...rest}>
      <SwapIcon size={16} />
    </button>
  )
}
