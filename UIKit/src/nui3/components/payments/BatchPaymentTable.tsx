import { useMemo, useState, type HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import type { Network } from '../../utils/address'
import { ZEC_DECIMALS } from '../../utils/amount'
import { cx } from '../../utils/cx'
import { parsePaymentCsv, validatePayments, type PaymentRow } from '../../utils/payments'
import { Button } from '../actions'
import { Field, Textarea } from '../forms'
import type { TxStatusValue } from '../zcash/TxStatus'
import { BatchPayments, type BatchActions } from './BatchPayments'

export interface BatchPaymentTableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  rows: PaymentRow[]
  onChange: (rows: PaymentRow[]) => void
  /** 'replace' swaps the rows for the CSV; 'append' adds them. */
  importMode?: 'replace' | 'append'
  showImport?: boolean
  decimals?: number
  symbol?: string
  network?: Network
  statuses?: Partial<Record<number, TxStatusValue>>
  /** Footer actions; a function receives { canSubmit, … } — disable submit while rows are invalid. */
  actions?: BatchActions
}

/** CSV paste/import + row removal + per-row validation + totals on top of BatchPayments. */
export function BatchPaymentTable({
  rows,
  onChange,
  importMode = 'replace',
  showImport = true,
  decimals = ZEC_DECIMALS,
  symbol = 'ZEC',
  network,
  statuses,
  actions,
  className,
  ...rest
}: BatchPaymentTableProps) {
  const { m } = useNuiLocale()
  const [csv, setCsv] = useState('')
  const [error, setError] = useState<string | undefined>()
  const validation = useMemo(() => validatePayments(rows, { decimals, network }), [rows, decimals, network])

  const importCsv = () => {
    const parsed = parsePaymentCsv(csv)
    if (parsed.length === 0) {
      setError(m.noCsvRows)
      return
    }
    setError(undefined)
    if (importMode === 'append') {
      const offset = rows.reduce((n, r) => Math.max(n, r.line), 0)
      onChange([...rows, ...parsed.map((r, i) => ({ ...r, line: offset + i + 1 }))])
    } else {
      onChange(parsed)
    }
    setCsv('')
  }

  return (
    <div className={cx('nui-batch-editor', className)} {...rest}>
      {showImport && (
        <div className="nui-batch__import">
          <Field label={m.pasteCsv} hint={m.pasteCsvHint} error={error}>
            <Textarea
              mono
              rows={4}
              value={csv}
              onChange={(e) => {
                setCsv(e.target.value)
                if (error) setError(undefined)
              }}
              placeholder="name,address,amount,memo"
              spellCheck={false}
            />
          </Field>
          <div className="nui-batch__import-actions">
            <Button variant="outline" size="sm" onClick={importCsv} disabled={!csv.trim()}>
              {m.importCsv}
            </Button>
          </div>
        </div>
      )}
      <BatchPayments
        rows={rows}
        validation={validation}
        onRemove={(i) => onChange(rows.filter((_, j) => j !== i))}
        decimals={decimals}
        symbol={symbol}
        network={network}
        statuses={statuses}
        actions={actions}
      />
    </div>
  )
}
