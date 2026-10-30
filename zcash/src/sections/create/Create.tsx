import { useEffect, useMemo, useState } from 'react'
import { PageHead } from '../../components/Shell'
import { DataCell, ErrorCallout, Field, Notice, Panel, Reading, Segmented, Toggle, TxNotice } from '../../components/ui'
import { CONFIG, nearblocks, SELL_FEE_BPS, TAX } from '../../lib/config'
import { bpsToPct, fromAtoms, groupInt, toAtoms } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import type { CreateArgs, CreateResult, FeeMode } from '../../lib/types'
import { useTx } from '../../lib/useTx'
import { useWallet } from '../../wallet/WalletProvider'

const U128_MAX = (1n << 128n) - 1n
type FeeChoice = 'standard' | 'tax'

interface Form {
  symbol: string
  name: string
  decimals: string
  total: string
  useCurve: boolean
  s: string
  p0: string
  p1: string
  gradMcap: string
  fee: FeeChoice
  reference: string
  referenceHash: string
  icon: string
}

const INITIAL: Form = {
  symbol: '',
  name: '',
  decimals: '8',
  total: '1000000000',
  useCurve: true,
  s: '',
  p0: '0.00000002',
  p1: '0.00000016',
  gradMcap: '',
  fee: 'standard',
  reference: '',
  referenceHash: '',
  icon: '',
}

const int = (v: string) => (/^\d+$/.test(v) ? BigInt(v) : null)

export function Create({ onView }: { onView: (symbol: string) => void }) {
  const { backend, session, bump } = useWallet()
  const [f, setF] = useState<Form>(INITIAL)
  const [touched, setTouched] = useState(false)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const tx = useTx<CreateResult>(bump)

  // ── derive + validate
  const decimals = int(f.decimals)
  const total = int(f.total)
  const sDefault = total != null ? (total * 80n) / 100n : null
  const s = f.s === '' ? sDefault : int(f.s)
  const p0 = toAtoms(f.p0, CONFIG.payment.decimals)
  const p1 = toAtoms(f.p1, CONFIG.payment.decimals)

  const errors: Partial<Record<keyof Form, string>> = {}
  if (!/^[A-Z0-9]{2,16}$/.test(f.symbol)) errors.symbol = '2–16 chars, A–Z and 0–9.'
  if (!f.name.trim()) errors.name = 'Required.'
  if (decimals == null || decimals > 18n) errors.decimals = '0–18.'
  if (total == null || total === 0n) errors.total = 'Whole tokens, greater than 0.'
  else if (decimals != null && total * 10n ** decimals > U128_MAX) errors.total = 'Exceeds u128 in atoms.'
  if (f.useCurve) {
    if (s == null || s === 0n) errors.s = 'Whole units, greater than 0.'
    else if (total != null && s >= total) errors.s = 'Must leave a reserve for the pool (s < total).'
    if (p0 == null || p0 === 0n) errors.p0 = `> 0, max ${CONFIG.payment.decimals} decimals.`
    if (p1 == null) errors.p1 = 'Invalid.'
    else if (p0 != null && p1 <= p0) errors.p1 = 'Graduation price must be above the start price.'
  }
  if (f.icon && !/^(https?:\/\/|data:image\/)/.test(f.icon)) errors.icon = 'URL or data:image/… URI.'
  if (f.referenceHash && !/^[A-Za-z0-9+/=]{20,}$/.test(f.referenceHash)) errors.referenceHash = 'Base64 sha256 of the reference file.'
  const valid = Object.keys(errors).length === 0

  const feeMode: FeeMode =
    f.fee === 'tax'
      ? { Tax: { total_bps: TAX.totalBps, holders_bps: TAX.holdersBps, platform_bps: TAX.platformBps, reward_asset: TAX.rewardAsset } }
      : { SellFee: { bps: SELL_FEE_BPS } }

  const args: CreateArgs | null = useMemo(() => {
    if (!valid || decimals == null || total == null) return null
    return {
      symbol: f.symbol,
      name: f.name.trim(),
      decimals: Number(decimals),
      total_supply: (total * 10n ** decimals).toString(),
      use_curve: f.useCurve,
      curve: f.useCurve ? { s: s!.toString(), p0: p0!.toString(), p1: p1!.toString() } : null,
      fee_mode: feeMode,
      reference: f.reference.trim() || null,
      reference_hash: f.referenceHash.trim() || null,
      icon: f.icon.trim() || null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, f, decimals, total, s, p0, p1])

  // Deposit depends only on the shape (curve / tax), so key the read on that.
  const depositKey = `${f.useCurve}:${f.fee}`
  const deposit = useAsync(
    () =>
      backend.getRequiredDeposit(
        args ?? {
          symbol: 'X',
          name: 'x',
          decimals: 8,
          total_supply: '1',
          use_curve: f.useCurve,
          curve: f.useCurve ? { s: '1', p0: '1', p1: '2' } : null,
          fee_mode: feeMode,
          reference: null,
          reference_hash: null,
          icon: null,
        },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [backend, depositKey, backend.kind === 'near' ? JSON.stringify(args) : ''],
  )

  // Graduation market cap → p1 = mcap / total units.
  useEffect(() => {
    if (!f.gradMcap || total == null || total === 0n) return
    const m = toAtoms(f.gradMcap, CONFIG.payment.decimals)
    if (m == null) return
    set('p1', fromAtoms(m / total, CONFIG.payment.decimals, CONFIG.payment.decimals).replace(/,/g, ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.gradMcap, f.total])

  const err = (k: keyof Form) => (touched || f[k] !== INITIAL[k] ? errors[k] ?? null : null)

  const submit = () => {
    setTouched(true)
    if (!session || !args || deposit.data == null) return
    tx.run('CREATING', () => backend.createToken(session.signer, args, deposit.data!))
  }

  const reserve = total != null && s != null && s < total ? total - s : null
  const sym = f.symbol || 'SYMBOL'

  return (
    <div>
      <PageHead
        eyebrow="CREATE / NEW TOKEN"
        title={
          <>
            Mint a <span className="lime-mark">token</span>
          </>
        }
        lede="One factory call. Plain mint sends 100% to you; curve mode sells s units on a bonding curve, then graduates into a Ref Finance pool."
      />

      <div className="split">
        <form
          className="stack-lg"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          noValidate
        >
          <Panel title="01 · Identity">
            <div className="form-grid">
              <Field label="Symbol" htmlFor="c-symbol" error={err('symbol')} hint={`Becomes ${(f.symbol || 'symbol').toLowerCase()}.${CONFIG.factory}`}>
                <input id="c-symbol" className="input" value={f.symbol} maxLength={16} onChange={(e) => set('symbol', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="NEBULAE69M" aria-invalid={!!err('symbol')} />
              </Field>
              <Field label="Name" htmlFor="c-name" error={err('name')}>
                <input id="c-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Nebulae 69M" aria-invalid={!!err('name')} />
              </Field>
              <Field label="Decimals" htmlFor="c-dec" error={err('decimals')} hint="Default 8.">
                <input id="c-dec" className="input" inputMode="numeric" value={f.decimals} onChange={(e) => set('decimals', e.target.value.replace(/\D/g, ''))} aria-invalid={!!err('decimals')} />
              </Field>
              <Field
                label="Total supply"
                htmlFor="c-total"
                error={err('total')}
                hint={total != null && decimals != null && !errors.total ? `${groupInt(total * 10n ** decimals)} atoms (u128)` : 'Whole tokens.'}
              >
                <input id="c-total" className="input" inputMode="numeric" value={f.total} onChange={(e) => set('total', e.target.value.replace(/\D/g, ''))} aria-invalid={!!err('total')} />
              </Field>
            </div>
          </Panel>

          <Panel title="02 · Distribution">
            <Toggle
              id="c-curve"
              checked={f.useCurve}
              onChange={(v) => set('useCurve', v)}
              label={f.useCurve ? 'use_curve · bonding curve' : 'use_curve · off — plain mint'}
              sub={f.useCurve ? 'Sell s units on a curve; the rest seeds the pool at graduation.' : '100% of supply minted to your account. No curve, no pool.'}
            />
            {f.useCurve && (
              <div className="form-grid">
                <Field label="s · units for sale" htmlFor="c-s" error={err('s')} hint={f.s === '' ? 'Default 80% of supply.' : undefined}>
                  <input id="c-s" className="input" inputMode="numeric" placeholder={sDefault?.toString() ?? ''} value={f.s} onChange={(e) => set('s', e.target.value.replace(/\D/g, ''))} aria-invalid={!!err('s')} />
                </Field>
                <Field label="reserve = total − s" htmlFor="c-reserve" hint="Held back, injected into the pool at graduation.">
                  <input id="c-reserve" className="input" readOnly value={reserve != null ? groupInt(reserve) : '—'} />
                </Field>
                <Field label={`p0 · start price (${CONFIG.payment.symbol}/unit)`} htmlFor="c-p0" error={err('p0')}>
                  <input id="c-p0" className="input" inputMode="decimal" value={f.p0} onChange={(e) => set('p0', e.target.value)} aria-invalid={!!err('p0')} />
                </Field>
                <Field label={`p1 · graduation price (${CONFIG.payment.symbol}/unit)`} htmlFor="c-p1" error={err('p1')}>
                  <input id="c-p1" className="input" inputMode="decimal" value={f.p1} onChange={(e) => { set('p1', e.target.value); set('gradMcap', '') }} aria-invalid={!!err('p1')} />
                </Field>
                <Field
                  className="span-2"
                  label={`…or derive p1 from graduation market cap (${CONFIG.payment.symbol})`}
                  htmlFor="c-mcap"
                  hint={p1 != null && total != null ? `At p1, market cap = ${fromAtoms(p1 * total, CONFIG.payment.decimals, 2)} ${CONFIG.payment.symbol}.` : undefined}
                >
                  <input id="c-mcap" className="input" inputMode="decimal" placeholder="e.g. 160" value={f.gradMcap} onChange={(e) => set('gradMcap', e.target.value)} />
                </Field>
              </div>
            )}
          </Panel>

          <Panel title="03 · Fee mode">
            <Segmented<FeeChoice>
              label="Fee mode"
              value={f.fee}
              onChange={(v) => set('fee', v)}
              options={[
                { value: 'standard', title: `Standard · SellFee ${bpsToPct(SELL_FEE_BPS)}`, sub: 'Flat fee on curve sells. No holder rewards.' },
                { value: 'tax', title: `Tax mode · ${bpsToPct(TAX.totalBps)} → holders`, sub: `Transfer tax: ${bpsToPct(TAX.holdersBps)} holders · ${bpsToPct(TAX.platformBps)} platform.` },
              ]}
            />
            {f.fee === 'tax' && (
              <>
                <div className="tax-strip">
                  <span>
                    <span className="hl">HOLD ${sym}, EARN {TAX.rewardSymbol.toUpperCase()}</span> — {bpsToPct(TAX.totalBps)} TRANSFER TAX ({bpsToPct(TAX.holdersBps)} HOLDERS · {bpsToPct(TAX.platformBps)} PLATFORM)
                  </span>
                </div>
                <div className="form-grid">
                  <Field label="Reward asset" htmlFor="c-reward" hint="Fixed this release.">
                    <input id="c-reward" className="input" readOnly value={`${TAX.rewardSymbol} · ${TAX.rewardAsset}`} />
                  </Field>
                  <Field label="Distribution" htmlFor="c-dist" hint="Centralised bot swaps the holder share to wZEC and splits it pro rata.">
                    <input id="c-dist" className="input" readOnly value={`Every ${TAX.distributionIntervalMs / 60000} min`} />
                  </Field>
                </div>
              </>
            )}
          </Panel>

          <Panel title="04 · Metadata (optional)">
            <div className="form-grid">
              <Field className="span-2" label="Icon" htmlFor="c-icon" error={err('icon')} hint="https:// URL or data:image/svg+xml URI.">
                <input id="c-icon" className="input" value={f.icon} onChange={(e) => set('icon', e.target.value)} placeholder="https://…/icon.svg" aria-invalid={!!err('icon')} />
              </Field>
              <Field label="Reference" htmlFor="c-ref" hint="Link to a JSON with more metadata.">
                <input id="c-ref" className="input" value={f.reference} onChange={(e) => set('reference', e.target.value)} placeholder="https://…/meta.json" />
              </Field>
              <Field label="Reference hash" htmlFor="c-refhash" error={err('referenceHash')}>
                <input id="c-refhash" className="input" value={f.referenceHash} onChange={(e) => set('referenceHash', e.target.value)} placeholder="base64 sha256" aria-invalid={!!err('referenceHash')} />
              </Field>
            </div>
          </Panel>

          <Panel title="05 · Deposit & submit">
            <div className="data-grid cols-3">
              <DataCell
                label="Required deposit"
                value={deposit.data != null ? `${fromAtoms(deposit.data, 24, 3)} N` : deposit.error ? '—' : '…'}
                sub="get_token_required_deposit"
              />
              <DataCell label="Accounts" value={f.useCurve ? '2' : '1'} sub={f.useCurve ? 'token + curve' : 'token'} />
              <DataCell label="Fee mode" value={f.fee === 'tax' ? `TAX ${bpsToPct(TAX.totalBps)}` : `SELL ${bpsToPct(SELL_FEE_BPS)}`} />
            </div>
            {deposit.error && <ErrorCallout error={deposit.error} onRetry={deposit.reload} />}
            {!session && <Notice tag="WALLET">Connect a NEAR testnet account first — CREATE needs a signer.</Notice>}
            {touched && !valid && <Notice tone="error">Fix the highlighted fields.</Notice>}
            <button className="btn btn-primary btn-block" disabled={!session || !!tx.pending || deposit.data == null}>
              {tx.pending ? 'CREATING…' : 'CREATE →'}
            </button>
            {tx.error && <ErrorCallout error={tx.error} />}
            {tx.result && (
              <TxNotice result={tx.result}>
                <dl className="kv" style={{ marginTop: 8 }}>
                  <dt>token</dt>
                  <dd>
                    <a href={nearblocks.address(tx.result.token_account)} target="_blank" rel="noreferrer">
                      {tx.result.token_account} ↗
                    </a>
                  </dd>
                  {tx.result.curve_account && (
                    <>
                      <dt>curve</dt>
                      <dd>
                        <a href={nearblocks.address(tx.result.curve_account)} target="_blank" rel="noreferrer">
                          {tx.result.curve_account} ↗
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => onView(args?.symbol ?? f.symbol)}>
                    VIEW IN LAUNCH →
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setF(INITIAL)
                      setTouched(false)
                      tx.reset()
                    }}
                  >
                    CREATE ANOTHER
                  </button>
                </div>
              </TxNotice>
            )}
          </Panel>
        </form>

        <aside className="stack">
          <Panel title="create_token args">
            {args ? <pre className="code-block">{JSON.stringify({ args }, null, 2)}</pre> : <Reading label="WAITING FOR VALID INPUT" />}
            <p className="tiny muted">EXACTLY WHAT GETS SIGNED. U128 VALUES ARE DECIMAL STRINGS IN ATOMS.</p>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
