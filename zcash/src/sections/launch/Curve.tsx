import { useState } from 'react'
import { PageHead } from '../../components/Shell'
import { DataCell, Empty, ErrorCallout, Field, Meter, Notice, Panel, Reading, Tween, TxNotice } from '../../components/ui'
import { CONFIG, nearblocks, SELL_FEE_BPS, TAX } from '../../lib/config'
import { amountShort, bpsToPct, fromAtoms, groupInt, shortAccount, shortHex, toAtoms } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import type { CurveView, TokenInfo } from '../../lib/types'
import { useTx } from '../../lib/useTx'
import { useWallet } from '../../wallet/WalletProvider'
import { CurveCharts } from './CurveCharts'
import { MyRewards } from './MyRewards'
import { curveStats, GRAD_STAGES, gradStage, KindBadge, pay, sig, StatusBadge, TaxBadge, toGraduate, TokenIcon } from './tokenView'

export function Curve({ token, onPick, onBrowse }: { token: TokenInfo | null; onPick: (t: TokenInfo) => void; onBrowse: () => void }) {
  if (!token) return <CurvePicker onPick={onPick} onBrowse={onBrowse} />
  return <CurveDetail key={token.curve_account} token={token} />
}

function CurvePicker({ onPick, onBrowse }: { onPick: (t: TokenInfo) => void; onBrowse: () => void }) {
  const { backend, version } = useWallet()
  const list = useAsync(() => backend.getTokens(0, 50), [backend, version])
  const curves = (list.data ?? []).filter((t) => t.curve_account)
  return (
    <div>
      <PageHead eyebrow="LAUNCH / CURVE" title="Pick a curve" lede="Choose a bonding-curve token to trade, claim or graduate." />
      {list.error ? (
        <ErrorCallout error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <Reading />
      ) : curves.length === 0 ? (
        <Empty title="No curve tokens" action={<button className="btn btn-secondary" onClick={onBrowse}>BACK TO LAUNCHES</button>}>
          Only tokens created with use_curve have a curve page.
        </Empty>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Mode</th>
                  <th>Curve account</th>
                </tr>
              </thead>
              <tbody>
                {curves.map((t) => (
                  <tr key={t.symbol} data-clickable onClick={() => onPick(t)}>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => onPick(t)}>
                        {t.symbol} →
                      </button>
                    </td>
                    <td>{t.name}</td>
                    <td>{t.tax_enabled ? <TaxBadge /> : <span className="tiny muted">SELL FEE {bpsToPct(SELL_FEE_BPS)}</span>}</td>
                    <td className="tiny">{t.curve_account}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function CurveDetail({ token }: { token: TokenInfo }) {
  const { backend, session, version, bump } = useWallet()
  const curveAccount = token.curve_account!
  const curve = useAsync(() => backend.getCurve(curveAccount), [backend, curveAccount, version])
  const pos = useAsync(
    () => (session ? backend.getPosition(curveAccount, session.idCommitment) : Promise.resolve(null)),
    [backend, curveAccount, session?.idCommitment, version],
  )
  const c = curve.data

  return (
    <div>
      <PageHead
        eyebrow={`LAUNCH / CURVE / ${token.symbol}`}
        title={
          <span className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
            <TokenIcon token={token} />
            {token.symbol}
          </span>
        }
        lede={token.name}
        aside={
          <div className="badge-stack" style={{ justifyContent: 'flex-start' }}>
            {c && <StatusBadge status={c.status} />}
            <KindBadge token={token} />
            {token.tax_enabled && <TaxBadge />}
          </div>
        }
      />

      {curve.error && !c ? (
        <ErrorCallout error={curve.error} onRetry={curve.reload} />
      ) : !c ? (
        <div className="stack">
          <Reading label="READING CURVE" />
          <div className="skeleton" style={{ height: 84 }} />
          <div className="skeleton" style={{ height: 44 }} />
          <div className="skeleton" style={{ height: 220 }} />
        </div>
      ) : (
        <div className="split">
          <div className="stack-lg">
            <CurveOverview token={token} c={c} />

            <CurveCharts token={token} c={c} />

            <div className="hash-strip">
              <span className="data-label">id_commitment</span>
              <span className="hash" title={session?.idCommitment}>
                {session ? shortHex(session.idCommitment, 12) : '— connect a wallet to derive your commitment —'}
              </span>
              <span className="tiny muted">BEARER CAPABILITY: WHOEVER HOLDS THIS HASH CONTROLS THE POSITION</span>
            </div>

            {!session && <Notice tag="READ-ONLY">No NEAR account connected — buttons cannot sign. Connect from the wallet chip top-right.</Notice>}

            <Position c={c} units={pos.data?.units} claimed={pos.data?.claimed} loading={pos.loading && !pos.data} />

            <TradeForms token={token} c={c} onDone={bump} />

            <AfterGraduation token={token} c={c} units={pos.data?.units ?? '0'} claimed={pos.data?.claimed ?? '0'} onDone={bump} />

            {c.status === 'GRADUATED' && <PoolPanel token={token} c={c} />}

            {token.tax_enabled && <MyRewards token={token} compact />}
          </div>
          <FlowAside c={c} />
        </div>
      )}
    </div>
  )
}

function CurveOverview({ token, c }: { token: TokenInfo; c: CurveView }) {
  const st = curveStats(c)
  const trading = c.status === 'TRADING'
  const stage = gradStage(st.progress)
  const left = toGraduate(c, token.tax_enabled)
  return (
    <div className="stack">
      {token.tax_enabled && (
        <div className="tax-strip">
          <span>
            <span className="hl">{bpsToPct(TAX.totalBps)} TRANSFER TAX</span> — {bpsToPct(TAX.holdersBps)} → HOLDERS ({TAX.rewardSymbol.toUpperCase()}) · {bpsToPct(TAX.platformBps)} → PLATFORM
          </span>
          <span className="tiny">REWARD ASSET {TAX.rewardAsset}</span>
        </div>
      )}
      <div className="data-grid">
        <DataCell label="Price" value={sig(st.price)} sub={`${CONFIG.payment.symbol} / unit`} title={st.price.toString()} />
        <DataCell label="Market cap" value={fromAtoms(st.mcap, CONFIG.payment.decimals, 2)} sub={CONFIG.payment.symbol} />
        <DataCell label="Units sold" value={groupInt(c.units_sold)} sub={`/ ${groupInt(c.s)} s`} />
        <DataCell label="Pool reserve" value={fromAtoms(c.pool_reserve, CONFIG.payment.decimals, 3)} sub={CONFIG.payment.symbol} />
      </div>
      <div className="coord-strip" aria-label="Curve coordinates">
        <span>
          <b>X_</b>
          {shortAccount(c.curve_account, 40)}
        </span>
        <span>
          <b>Y_</b>
          {groupInt(c.units_sold)}/{groupInt(c.s)}
        </span>
        <span>
          <b>Z_</b>
          {fromAtoms(c.pool_reserve, CONFIG.payment.decimals, 3)} {CONFIG.payment.symbol}
        </span>
      </div>
      <div>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="data-label">Graduation progress</span>
          <span className="tiny">
            {trading && <span className={`progress-label progress-label--${stage}`}>{GRAD_STAGES[stage]} · </span>}
            {c.status === 'SOLD_OUT' && <span className="progress-label progress-label--awaiting">■ Awaiting graduation · </span>}
            <Tween value={st.progress * 100} format={(n) => `${n.toFixed(2)}%`} />
          </span>
        </div>
        <Meter value={st.progress} size="lg" label="Graduation progress" live={trading} stage={stage} awaiting={c.status === 'SOLD_OUT'} ticks />
        <div className="meter-legend">
          <span>sell out s = {groupInt(c.s)} units to graduate and migrate to a pool</span>
          <span>reserve {groupInt(c.reserve_units)} → pool</span>
        </div>
        {trading && (
          <p className="to-grad" title={token.tax_enabled ? `Includes the ${bpsToPct(TAX.totalBps)} transfer tax taken from each buy` : 'Curve cost of the remaining units'}>
            ≈ <b>{amountShort(left, CONFIG.payment.decimals)} {CONFIG.payment.symbol}</b> of buys to graduate
          </p>
        )}
      </div>
    </div>
  )
}

function Position({ c, units, claimed, loading }: { c: CurveView; units?: string; claimed?: string; loading: boolean }) {
  const { session } = useWallet()
  if (!session) return null
  const u = BigInt(units ?? '0')
  const share = BigInt(c.units_sold) === 0n ? 0 : Number((u * 10000n) / BigInt(c.units_sold)) / 100
  return (
    <div className="data-grid cols-3">
      <DataCell label="Your units" value={loading ? '…' : groupInt(u)} sub={`${share.toFixed(2)}% of sold`} />
      <DataCell label="Claimed" value={loading ? '…' : groupInt(claimed ?? '0')} sub={c.status === 'GRADUATED' ? 'real tokens' : 'claim opens at graduation'} />
      <DataCell label="Fee mode" value={'Tax' in c.fee_mode ? `TAX ${bpsToPct(TAX.totalBps)}` : `SELL ${bpsToPct(SELL_FEE_BPS)}`} sub={'Tax' in c.fee_mode ? 'on buys + sells' : 'on sells only'} />
    </div>
  )
}

function TradeForms({ token, c, onDone }: { token: TokenInfo; c: CurveView; onDone: () => void }) {
  const { backend, session, version } = useWallet()
  const [amount, setAmount] = useState('')
  const [units, setUnits] = useState('')
  const buyTx = useTx(onDone)
  const sellTx = useTx(onDone)
  const bal = useAsync(() => (session ? backend.getPaymentBalance(session.accountId) : Promise.resolve(null)), [session?.accountId, version])

  const trading = c.status === 'TRADING'
  const atoms = amount ? toAtoms(amount, CONFIG.payment.decimals) : null
  const amountErr =
    amount === '' ? null : atoms === null ? `Max ${CONFIG.payment.decimals} decimals, digits only.` : atoms === 0n ? 'Must be greater than 0.' : bal.data != null && atoms > bal.data ? 'Exceeds your balance.' : null
  const unitsN = /^\d+$/.test(units) ? BigInt(units) : null
  const unitsErr = units === '' ? null : unitsN === null ? 'Whole units only.' : unitsN === 0n ? 'Must be greater than 0.' : null

  const disabledWhy = !session ? 'Connect a wallet to trade.' : !trading ? `Curve is ${c.status.replace('_', ' ')} — trading closed.` : null

  return (
    <div className="split-even">
      <Panel title="Buy" actions={<span className="tiny muted">BAL {bal.data != null ? pay(bal.data, 4) : '—'}</span>}>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (!session || atoms == null || amountErr) return
            buyTx.run('BUYING', () => backend.buy(session.signer, c.curve_account, atoms, session.idCommitment)).then((r) => r && setAmount(''))
          }}
        >
          <Field label={`Pay (${CONFIG.payment.symbol})`} htmlFor="buy-amt" error={amountErr} hint="Converted to exact atoms. Unspent remainder is refunded.">
            <div className="input-wrap">
              <input
                id="buy-amt"
                className="input"
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={!!amountErr}
                disabled={!!disabledWhy}
              />
              <span className="input-suffix">{CONFIG.payment.symbol}</span>
            </div>
          </Field>
          {atoms != null && atoms > 0n && <p className="tiny muted">= {groupInt(atoms)} ATOMS · NO PREVIEW — CURVE INTEGRAL RUNS IN THE CONTRACT</p>}
          {token.tax_enabled && <p className="tiny muted">{bpsToPct(TAX.totalBps)} TAX TAKEN FROM THE PAYMENT BEFORE PRICING</p>}
          <button className="btn btn-primary btn-block" disabled={!!disabledWhy || !atoms || !!amountErr || !!buyTx.pending}>
            {buyTx.pending ? `${buyTx.pending}…` : 'BUY →'}
          </button>
          {disabledWhy && <p className="tiny muted">{disabledWhy}</p>}
          {buyTx.error && <ErrorCallout error={buyTx.error} />}
          {buyTx.result && <TxNotice result={buyTx.result} />}
        </form>
      </Panel>

      <Panel title="Sell">
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (!session || unitsN == null || unitsErr) return
            sellTx.run('SELLING', () => backend.sell(session.signer, c.curve_account, unitsN, session.idCommitment)).then((r) => r && setUnits(''))
          }}
        >
          <Field
            label="Units"
            htmlFor="sell-units"
            error={unitsErr}
            hint={'Tax' in c.fee_mode ? `${bpsToPct(TAX.totalBps)} transfer tax on proceeds.` : `${bpsToPct(SELL_FEE_BPS)} sell fee on proceeds.`}
          >
            <div className="input-wrap">
              <input
                id="sell-units"
                className="input"
                inputMode="numeric"
                placeholder="0"
                value={units}
                onChange={(e) => setUnits(e.target.value.replace(/[^\d]/g, ''))}
                aria-invalid={!!unitsErr}
                disabled={!!disabledWhy}
              />
              <span className="input-suffix">UNITS</span>
            </div>
          </Field>
          <button className="btn btn-secondary btn-block" disabled={!!disabledWhy || !unitsN || !!unitsErr || !!sellTx.pending}>
            {sellTx.pending ? `${sellTx.pending}…` : 'SELL'}
          </button>
          {disabledWhy && <p className="tiny muted">{disabledWhy}</p>}
          {sellTx.error && <ErrorCallout error={sellTx.error} />}
          {sellTx.result && <TxNotice result={sellTx.result} />}
        </form>
      </Panel>
    </div>
  )
}

function AfterGraduation({ token, c, units, claimed, onDone }: { token: TokenInfo; c: CurveView; units: string; claimed: string; onDone: () => void }) {
  const { backend, session } = useWallet()
  const claimTx = useTx(onDone)
  const gradTx = useTx(onDone)
  const graduated = c.status === 'GRADUATED'
  const soldOut = BigInt(c.units_sold) === BigInt(c.s)
  const claimable = BigInt(units) - BigInt(claimed)

  return (
    <Panel title="After graduation">
      <div className="split-even">
        <div className="stack">
          <p className="small">
            Claim swaps your curve units for real <b>{token.symbol}</b> tokens, sent to your account. Opens once the curve has graduated.
          </p>
          <button
            className="btn btn-primary btn-block"
            disabled={!session || !graduated || claimable <= 0n || !!claimTx.pending}
            onClick={() => session && claimTx.run('CLAIMING', () => backend.claim(session.signer, c.curve_account, session.idCommitment))}
          >
            {claimTx.pending ? 'CLAIMING…' : graduated ? `CLAIM ${claimable > 0n ? groupInt(claimable) + ' ' : ''}→` : 'CLAIM (LOCKED)'}
          </button>
          {graduated && session && claimable <= 0n && <p className="tiny muted">NOTHING LEFT TO CLAIM FOR THIS ID_COMMITMENT.</p>}
          {claimTx.error && <ErrorCallout error={claimTx.error} />}
          {claimTx.result && <TxNotice result={claimTx.result} />}
        </div>
        <div className="stack">
          <p className="small">
            Anyone can graduate once <code>units_sold == s</code>: the curve migrates its reserve into a Ref Finance pool. Re-running resumes an unfinished migration and is a no-op once done.
          </p>
          {soldOut || graduated ? (
            <button
              className="btn btn-primary btn-block"
              disabled={!session || !!gradTx.pending}
              onClick={() => session && gradTx.run('MIGRATING', () => backend.graduate(session.signer, c.curve_account))}
            >
              {gradTx.pending ? 'MIGRATING…' : graduated ? 'RESUME MIGRATION →' : 'GRADUATE →'}
            </button>
          ) : (
            <p className="tiny muted">
              GRADUATE UNLOCKS AT {groupInt(c.s)} UNITS SOLD · {groupInt(BigInt(c.s) - BigInt(c.units_sold))} TO GO
            </p>
          )}
          {gradTx.error && <ErrorCallout error={gradTx.error} />}
          {gradTx.result && <TxNotice result={gradTx.result} />}
        </div>
      </div>
    </Panel>
  )
}

function PoolPanel({ token, c }: { token: TokenInfo; c: CurveView }) {
  return (
    <Panel title="Liquidity pool" actions={<span className="badge badge-positive">MIGRATED</span>}>
      <div className="data-grid">
        <DataCell
          label="migrated_to_pool"
          value={
            c.migrated_to_pool ? (
              <a href={nearblocks.address(c.migrated_to_pool)} target="_blank" rel="noreferrer">
                {shortAccount(c.migrated_to_pool, 20)} ↗
              </a>
            ) : (
              '—'
            )
          }
          sub={c.migrated_to_pool?.includes('dcl') ? 'Ref DCL' : 'Ref Finance v2'}
        />
        <DataCell label="Pool id" value={c.pool_id != null ? `#${c.pool_id}` : '—'} />
        <DataCell label="Injected" value={c.injected ? fromAtoms(c.injected.payment, CONFIG.payment.decimals, 3) : '—'} sub={CONFIG.payment.symbol} />
        <DataCell label="Injected" value={c.injected ? fromAtoms(c.injected.tokens, token.decimals, 0) : '—'} sub={token.symbol} />
      </div>
    </Panel>
  )
}

function FlowAside({ c }: { c: CurveView }) {
  const sold = BigInt(c.units_sold)
  const s = BigInt(c.s)
  const state = (i: number) => {
    const phase = c.status === 'GRADUATED' ? 3 : sold === s ? 2 : 0
    return i < phase ? 'done' : i === phase ? 'active' : 'todo'
  }
  const steps = [
    ['Buy on the curve', 'Pay in ' + CONFIG.payment.symbol + '; units are booked to your id_commitment, not your account.'],
    ['Sell any time', 'Return units to the curve while it is trading. Only aggregates are public.'],
    ['Graduate', 'At units_sold == s, the reserve and the held-back supply migrate to a Ref pool.'],
    ['Claim forever', 'Holders claim real tokens after graduation — no deadline.'],
  ]
  return (
    <aside className="panel">
      <header className="panel-head">
        <h3>How it flows</h3>
      </header>
      <div className="panel-body">
        <ol className="steps">
          {steps.map(([t, b], i) => (
            <li key={t} className="step" data-state={state(i)}>
              <span className="step-no">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="step-title">{t}</div>
                <div className="step-body">{b}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
