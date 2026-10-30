import { useMemo, type HTMLAttributes, type ReactNode } from 'react'
import { useNuiLocale, type Messages } from '../../i18n'
import { CloseIcon } from '../../icons'
import type { Network } from '../../utils/address'
import { ZEC_DECIMALS } from '../../utils/amount'
import { cx } from '../../utils/cx'
import { validatePayments, type PaymentIssue, type PaymentRow, type PaymentValidation, type ValidatedPayment } from '../../utils/payments'
import { IconButton } from '../actions'
import { DataTable, EmptyState, type DataTableColumn } from '../surfaces'
import { Address } from '../zcash/Address'
import { Amount } from '../zcash/Amount'
import { PrivacyBadge } from '../zcash/privacy'
import { TxStatus, type TxStatusValue } from '../zcash/TxStatus'

export interface BatchSummary {
  recipients: number
  valid: number
  invalid: number
  /** Sum of valid rows, base units. */
  total: bigint
  /** No rows need attention and there is at least one row. */
  canSubmit: boolean
}

export type BatchActions = ReactNode | ((summary: BatchSummary) => ReactNode)

export interface BatchPaymentsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  rows: PaymentRow[]
  /** Renders a remove IconButton per row. */
  onRemove?: (index: number, row: PaymentRow) => void
  decimals?: number
  symbol?: string
  network?: Network
  /** Per-row tx status by row index (after sending). */
  statuses?: Partial<Record<number, TxStatusValue>>
  /** Footer actions; a function receives the summary (e.g. to disable submit). */
  actions?: BatchActions
  /** Precomputed validation (BatchPaymentTable passes its own). */
  validation?: PaymentValidation
}

export function issueText(issue: PaymentIssue, m: Messages, duplicates = 2): string {
  switch (issue) {
    case 'address':
      return m.invalidAddress
    case 'amount':
      return m.invalidAmount
    case 'memoNotAllowed':
      return m.memoNotAllowed
    case 'memoTooLong':
      return m.memoTooLong
    case 'duplicate':
      return duplicates > 1 ? `${m.duplicateRecipient} ×${duplicates}` : m.duplicateRecipient
  }
}

type Item = { row: PaymentRow; v: ValidatedPayment; index: number }

/** Validated batch table: summary (recipients, total, valid / invalid) + per-row recipient, amount, privacy, status. */
export function BatchPayments({
  rows,
  onRemove,
  decimals = ZEC_DECIMALS,
  symbol = 'ZEC',
  network,
  statuses,
  actions,
  validation,
  className,
  ...rest
}: BatchPaymentsProps) {
  const { m, number } = useNuiLocale()
  const result = useMemo(() => validation ?? validatePayments(rows, { decimals, network }), [validation, rows, decimals, network])
  const counts = useMemo(() => {
    const c = new Map<string, number>()
    for (const r of rows) c.set(r.address, (c.get(r.address) ?? 0) + 1)
    return c
  }, [rows])
  const items: Item[] = rows.map((row, index) => ({ row, v: result.rows[index], index }))
  const summary: BatchSummary = {
    recipients: rows.length,
    valid: result.valid,
    invalid: result.invalid,
    total: result.total,
    canSubmit: rows.length > 0 && result.invalid === 0,
  }

  const columns: DataTableColumn<Item>[] = [
    { key: 'n', header: '#', cell: (it) => <span className="nui-text-muted">{it.index + 1}</span>, width: 40 },
    {
      key: 'recipient',
      header: m.recipient,
      cell: ({ row, v }) => (
        <div className="nui-batch__recipient" data-invalid={v.issues.includes('address') || undefined}>
          {row.name && <span className="nui-batch__name">{row.name}</span>}
          {row.address ? <Address address={row.address} copyable={!v.issues.includes('address')} showKind={!v.issues.includes('address')} /> : <span>—</span>}
          {row.memo && (
            <span className="nui-batch__memo" title={row.memo}>
              {row.memo}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: m.amount,
      numeric: true,
      sortValue: ({ v }) => (v.units == null ? -1 : Number(v.units)),
      cell: ({ row, v }) =>
        v.units != null ? <Amount value={v.units} decimals={decimals} symbol={symbol} /> : <span className="nui-batch__issue">{row.amount || '—'}</span>,
    },
    {
      key: 'privacy',
      header: m.privacy,
      cell: ({ v }) => (v.issues.includes('address') ? <span className="nui-text-muted">—</span> : <PrivacyBadge level={v.shielded ? 'shielded' : 'public'} />),
    },
    {
      key: 'status',
      header: m.status,
      cell: ({ row, v, index }) => {
        if (v.issues.length > 0)
          return (
            <span className="nui-batch__issue">
              {v.issues.map((i) => issueText(i, m, counts.get(row.address))).join(' · ')}
            </span>
          )
        const st = statuses?.[index]
        return st ? <TxStatus status={st} /> : <span className="nui-text-muted">{m.valid}</span>
      },
    },
  ]
  if (onRemove) {
    columns.push({
      key: 'actions',
      header: <span className="nui-sr-only">{m.remove}</span>,
      numeric: true,
      width: 48,
      cell: ({ row, index }) => (
        <IconButton size="sm" label={`${m.remove} #${index + 1}`} onClick={() => onRemove(index, row)}>
          <CloseIcon size={12} />
        </IconButton>
      ),
    })
  }

  const footer = typeof actions === 'function' ? actions(summary) : actions

  return (
    <div className={cx('nui-batch', className)} {...rest}>
      <div className="nui-batch__summary" aria-live="polite">
        <span>
          <b>{number(summary.recipients)}</b> {m.recipients}
        </span>
        <span>
          {m.total} <b><Amount value={summary.total} decimals={decimals} symbol={symbol} /></b>
        </span>
        <span>
          {m.valid} <b>{number(summary.valid)}</b>
        </span>
        {summary.invalid > 0 && (
          <span data-invalid="">
            <b>{number(summary.invalid)}</b> {m.rowsInvalid}
          </span>
        )}
      </div>
      <DataTable
        className="nui-batch-table"
        columns={columns}
        rows={items}
        rowKey={(it) => `${it.index}-${it.row.line}-${it.row.address}`}
        rowInvalid={(it) => it.v.issues.length > 0}
        empty={<EmptyState title={m.noCsvRows} />}
      />
      {footer != null && <div className="nui-batch__footer">{footer}</div>}
    </div>
  )
}
