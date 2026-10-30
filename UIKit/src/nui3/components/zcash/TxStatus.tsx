import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import type { MessageKey } from '../../i18n'
import { cx } from '../../utils/cx'

export type TxStatusValue = 'pending' | 'confirming' | 'confirmed' | 'failed' | 'expired' | 'refunded'

const KEY: Record<TxStatusValue, MessageKey> = {
  pending: 'txPending',
  confirming: 'txConfirming',
  confirmed: 'txConfirmed',
  failed: 'txFailed',
  expired: 'txExpired',
  refunded: 'txRefunded',
}

export interface TxStatusProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: TxStatusValue
  confirmations?: number
  required?: number
}

/** Status dot + label, announced politely when it changes. */
export function TxStatus({ status, confirmations, required, className, ...rest }: TxStatusProps) {
  const { m, number } = useNuiLocale()
  return (
    <span className={cx('nui-tx-status', className)} data-status={status} aria-live="polite" aria-atomic="true" {...rest}>
      {m[KEY[status]]}
      {confirmations != null && required != null && (
        <span className="nui-tx-status__count">
          {number(confirmations)} / {number(required)}
        </span>
      )}
    </span>
  )
}
