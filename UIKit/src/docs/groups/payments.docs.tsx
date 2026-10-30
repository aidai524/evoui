import { useState } from 'react'
import { BatchPayments, BatchPaymentTable, Button, parsePaymentCsv, type PaymentRow, type TxStatusValue } from '../../nui3'
import { ADDR } from '../sample'
import type { ComponentDoc } from '../types'

const VALID_CSV = `name,address,amount,memo
Ana Ruiz,${ADDR.unified},12.5,October payroll
Ben Okafor,${ADDR.sapling},8.25,October payroll
Chen Wei,${ADDR.tex},3.1,`

const MIXED_CSV = `name,address,amount,memo
Ana Ruiz,${ADDR.unified},12.5,October payroll
Ben Okafor,${ADDR.sapling},8.25,October payroll
Chen Wei,${ADDR.tex},3.1,
Dev Patel,${ADDR.transparent},4,Bonus
Eve Martin,zs1notarealaddress,2.5,
Fay Lund,t1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,0,
Ana Ruiz again,${ADDR.unified},1.123456789,`

function BatchPaymentsDemo() {
  const [rows, setRows] = useState<PaymentRow[]>(() => parsePaymentCsv(VALID_CSV))
  const [statuses, setStatuses] = useState<Partial<Record<number, TxStatusValue>>>({})
  const send = () => {
    setStatuses({ 0: 'pending', 1: 'pending', 2: 'pending' })
    setTimeout(() => setStatuses({ 0: 'confirmed', 1: 'confirming', 2: 'failed' }), 1500)
  }
  return (
    <BatchPayments
      rows={rows}
      statuses={statuses}
      onRemove={(i) => setRows((r) => r.filter((_, j) => j !== i))}
      actions={(s) => (
        <>
          <span className="nui-text-small nui-text-muted">Sample data · nothing is sent.</span>
          <Button variant="solid" disabled={!s.canSubmit} onClick={send}>
            Sign & send
          </Button>
        </>
      )}
    />
  )
}

function BatchPaymentTableDemo() {
  const [rows, setRows] = useState<PaymentRow[]>(() => parsePaymentCsv(MIXED_CSV))
  const [mode, setMode] = useState<'replace' | 'append'>('replace')
  return (
    <div style={{ display: 'grid', gap: 'var(--nui-space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--nui-space-2)', flexWrap: 'wrap' }}>
        <Button size="sm" variant={mode === 'replace' ? 'outline' : 'ghost'} aria-pressed={mode === 'replace'} onClick={() => setMode('replace')}>
          Import replaces
        </Button>
        <Button size="sm" variant={mode === 'append' ? 'outline' : 'ghost'} aria-pressed={mode === 'append'} onClick={() => setMode('append')}>
          Import appends
        </Button>
      </div>
      <BatchPaymentTable
        rows={rows}
        onChange={setRows}
        importMode={mode}
        actions={(s) => (
          <>
            <span className="nui-text-small nui-text-muted">{s.canSubmit ? 'Ready to sign.' : 'Fix or remove the highlighted rows to continue.'}</span>
            <Button variant="solid" disabled={!s.canSubmit}>
              Review payroll
            </Button>
          </>
        )}
      />
    </div>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'BatchPayments',
    group: 'payments',
    className: 'nui-batch',
    description:
      'Validated payment batch: summary (recipients, total of valid rows, valid / invalid counts) and a table with recipient (name + Address + memo), Amount, PrivacyBadge derived from the address, status (issue text or TxStatus) and a remove button.',
    Demo: BatchPaymentsDemo,
    usage: `<BatchPayments rows={rows} statuses={statuses} onRemove={remove}\n  actions={(s) => <Button variant="solid" disabled={!s.canSubmit}>Sign & send</Button>} />`,
    props: [
      ['rows', 'PaymentRow[] ({ line, name?, address, amount: string, memo? })'],
      ['onRemove', '(index, row) => void'],
      ['decimals', 'number = 8'],
      ['symbol', "string = 'ZEC'"],
      ['network', "'main' | 'test'"],
      ['statuses', 'Partial<Record<rowIndex, TxStatusValue>>'],
      ['actions', 'ReactNode | (summary: { recipients, valid, invalid, total, canSubmit }) => ReactNode'],
    ],
  },
  {
    name: 'BatchPaymentTable',
    group: 'payments',
    className: 'nui-batch-editor',
    description:
      'BatchPayments plus a CSV paste area (parsePaymentCsv: header optional, en/zh aliases), replace / append import, row removal and per-row validation (address, amount, memo, duplicates). Submit stays disabled while any row is invalid. The sample includes a transparent memo, a bad address, a zero amount, 9 decimals and a duplicate.',
    Demo: BatchPaymentTableDemo,
    usage: `const [rows, setRows] = useState<PaymentRow[]>([])\n\n<BatchPaymentTable rows={rows} onChange={setRows} importMode="append"\n  actions={(s) => <Button variant="solid" disabled={!s.canSubmit}>Review</Button>} />`,
    props: [
      ['rows', 'PaymentRow[]'],
      ['onChange', '(rows: PaymentRow[]) => void'],
      ['importMode', "'replace' | 'append' = 'replace'"],
      ['showImport', 'boolean = true'],
      ['decimals / symbol / network', 'as BatchPayments'],
      ['statuses', 'Partial<Record<rowIndex, TxStatusValue>>'],
      ['actions', 'ReactNode | (summary) => ReactNode'],
    ],
  },
]
