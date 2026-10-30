import { useEffect, useState } from 'react'
import { PageHead } from '../../components/Shell'
import { Badge, DataCell, Empty, ErrorCallout, Field, Meter, Notice, Panel, Reading } from '../../components/ui'
import { CONFIG } from '../../lib/config'
import { clock, groupInt } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import type { TokenInfo } from '../../lib/types'
import { useWallet } from '../../wallet/WalletProvider'
import { StatusBadge } from '../launch/tokenView'
import { currentDecisions, curateApi, MAX_PER_Q, QUESTIONS, totalScore, type Application, type Decision, type DecisionKind, type QuestionId, type Slot } from './api'

type Tab = 'intake' | 'scoring' | 'decision' | 'schedule' | 'monitor'
const TABS: { id: Tab; label: string }[] = [
  { id: 'intake', label: '01 Intake' },
  { id: 'scoring', label: '02 Scoring' },
  { id: 'decision', label: '03 Decision' },
  { id: 'schedule', label: '04 Schedule' },
  { id: 'monitor', label: '05 Monitor' },
]
const MAX = QUESTIONS.length * MAX_PER_Q

export function Curate() {
  const [tab, setTab] = useState<Tab>('intake')
  const [selected, setSelected] = useState<string | null>(null)
  const [rev, setRev] = useState(0)
  const bump = () => setRev((r) => r + 1)

  const apps = useAsync(() => curateApi.applications(), [rev])
  const ledger = useAsync(() => curateApi.decisions(), [rev])
  const slots = useAsync(() => curateApi.schedule(), [rev])

  const selectedId = selected ?? apps.data?.[0]?.id ?? null
  const app = apps.data?.find((a) => a.id === selectedId) ?? null
  const current = currentDecisions(ledger.data ?? [])

  return (
    <div className="curate">
      <PageHead
        eyebrow="CURATE / CONSOLE"
        title="Curator console"
        lede="Recommendation, not a gate: any token can launch. Curators score applications and record whether the platform recommends them."
        aside={<span className={`status ${curateApi.remote ? 'status-online' : 'status-simulated'}`}>{curateApi.remote ? '/api :4123' : 'demo data'}</span>}
      />

      <div className="filter-chips" role="tablist" aria-label="Curate steps" style={{ marginBottom: 24, width: 'fit-content', maxWidth: '100%', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t.id} role="tab" className="chip" aria-pressed={tab === t.id} aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {apps.error ? (
        <ErrorCallout error={apps.error} onRetry={apps.reload} />
      ) : !apps.data ? (
        <Reading label="READING /API" />
      ) : apps.data.length === 0 ? (
        <Empty title="No applications">Projects apply through the intake form. Nothing is waiting.</Empty>
      ) : (
        <>
          {tab === 'intake' && <Intake apps={apps.data} current={current} selected={selectedId} onSelect={(id) => { setSelected(id); setTab('scoring') }} />}
          {tab === 'scoring' && app && <Scoring key={app.id} app={app} apps={apps.data} onSelect={setSelected} onSaved={bump} />}
          {tab === 'decision' && app && <DecisionView app={app} apps={apps.data} onSelect={setSelected} ledger={ledger.data ?? []} current={current} onSaved={bump} />}
          {tab === 'schedule' && <Schedule apps={apps.data} current={current} slots={slots.data} error={slots.error} onChange={bump} />}
          {tab === 'monitor' && <Monitor apps={apps.data} current={current} slots={slots.data ?? []} />}
        </>
      )}
    </div>
  )
}

function DecisionBadge({ d }: { d: Decision | undefined }) {
  if (!d) return <Badge tone="neutral">UNDECIDED</Badge>
  return d.decision === 'RECOMMEND' ? <Badge tone="positive">✓ RECOMMEND</Badge> : <Badge tone="outline">✕ NOT RECOMMENDED</Badge>
}

function AppPicker({ apps, value, onSelect }: { apps: Application[]; value: string; onSelect: (id: string) => void }) {
  return (
    <Field label="Application" htmlFor="cur-app">
      <select id="cur-app" className="input" value={value} onChange={(e) => onSelect(e.target.value)}>
        {apps.map((a) => (
          <option key={a.id} value={a.id}>
            {a.symbol} — {a.project}
          </option>
        ))}
      </select>
    </Field>
  )
}

function Intake({ apps, current, selected, onSelect }: { apps: Application[]; current: Map<string, Decision>; selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="panel">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Project</th>
              <th>Summary</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} data-clickable className={a.id === selected ? 'is-selected' : ''} onClick={() => onSelect(a.id)}>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => onSelect(a.id)}>
                    {a.symbol} →
                  </button>
                </td>
                <td>
                  {a.project}
                  <div className="tiny muted">{a.contact}</div>
                </td>
                <td className="small" style={{ maxWidth: 360 }}>
                  {a.summary}
                </td>
                <td className="tiny">{clock(a.submitted_at)}</td>
                <td>
                  <DecisionBadge d={current.get(a.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Scoring({ app, apps, onSelect, onSaved }: { app: Application; apps: Application[]; onSelect: (id: string) => void; onSaved: () => void }) {
  const existing = useAsync(() => curateApi.score(app.id), [app.id])
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, number>>>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (existing.data) {
      setAnswers(existing.data.answers)
      setNotes(existing.data.notes)
    }
  }, [existing.data])

  const total = totalScore({ application_id: app.id, answers, notes, updated_at: 0 })
  const answered = QUESTIONS.filter((q) => answers[q.id] != null).length

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await curateApi.saveScore({ application_id: app.id, answers, notes })
      setMsg({ ok: true, text: `Saved ${total}/${MAX}.` })
      onSaved()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="split">
      <Panel title={`Six questions · ${app.symbol}`}>
        {existing.loading && !existing.data && <Reading />}
        {existing.error && <ErrorCallout error={existing.error} onRetry={existing.reload} />}
        <ol className="steps">
          {QUESTIONS.map((q, i) => (
            <li key={q.id} className="step">
              <span className="step-no">{String(i + 1).padStart(2, '0')}</span>
              <div className="stack" style={{ marginTop: 0 }}>
                <div className="small" style={{ color: 'var(--ink)' }}>
                  {q.q}
                </div>
                <div className="filter-chips" role="radiogroup" aria-label={q.q} style={{ width: 'fit-content' }}>
                  {Array.from({ length: MAX_PER_Q + 1 }, (_, v) => (
                    <button key={v} type="button" role="radio" className="chip" aria-checked={answers[q.id] === v} aria-pressed={answers[q.id] === v} onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <Field label="Notes" htmlFor="cur-notes">
          <textarea id="cur-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <button className="btn btn-primary" onClick={save} disabled={saving || answered === 0}>
          {saving ? 'SAVING…' : 'SAVE SCORE →'}
        </button>
        {msg && <Notice tone={msg.ok ? 'success' : 'error'}>{msg.text}</Notice>}
      </Panel>
      <aside className="stack">
        <AppPicker apps={apps} value={app.id} onSelect={onSelect} />
        <Panel title="Score">
          <div className="data-value" style={{ fontSize: 40 }}>
            {total}
            <span className="muted" style={{ fontSize: 18 }}>
              /{MAX}
            </span>
          </div>
          <Meter value={total / MAX} label="Score" />
          <p className="tiny muted">
            {answered}/{QUESTIONS.length} ANSWERED · SCORE INFORMS, DOES NOT DECIDE
          </p>
        </Panel>
        <Panel title="Application">
          <p className="small">{app.summary}</p>
          {app.links.map((l) => (
            <a key={l} className="tiny break" href={l} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
              {l} ↗
            </a>
          ))}
        </Panel>
      </aside>
    </div>
  )
}

function DecisionView(props: { app: Application; apps: Application[]; onSelect: (id: string) => void; ledger: Decision[]; current: Map<string, Decision>; onSaved: () => void }) {
  const { app } = props
  const { session } = useWallet()
  const score = useAsync(() => curateApi.score(app.id), [app.id])
  const [kind, setKind] = useState<DecisionKind>('RECOMMEND')
  const [rationale, setRationale] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const entries = props.ledger.filter((d) => d.application_id === app.id).sort((a, b) => b.at - a.at)

  const record = async () => {
    setSaving(true)
    setErr(null)
    try {
      await curateApi.decide({ application_id: app.id, decision: kind, rationale: rationale.trim(), by: session?.accountId ?? 'anonymous-curator' })
      setRationale('')
      props.onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="split">
      <div className="stack-lg">
        <Panel title={`Record a recommendation · ${app.symbol}`} actions={<DecisionBadge d={props.current.get(app.id)} />}>
          <div className="segmented" role="radiogroup" aria-label="Recommendation">
            {(['RECOMMEND', 'NOT_RECOMMEND'] as DecisionKind[]).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} className="segment" onClick={() => setKind(k)}>
                <span className="segment-title">{k === 'RECOMMEND' ? 'Recommend' : 'Do not recommend'}</span>
                <span className="segment-sub">{k === 'RECOMMEND' ? 'Eligible for featured slots.' : 'Stays listed, not promoted.'}</span>
              </button>
            ))}
          </div>
          <Field label="Rationale" htmlFor="dec-why" hint="Required. Entries are append-only — a later entry supersedes, nothing is edited.">
            <textarea id="dec-why" className="input" value={rationale} onChange={(e) => setRationale(e.target.value)} />
          </Field>
          <button className="btn btn-primary" disabled={saving || !rationale.trim()} onClick={record}>
            {saving ? 'APPENDING…' : 'APPEND TO LEDGER →'}
          </button>
          {err && <Notice tone="error">{err}</Notice>}
        </Panel>

        <Panel title="Ledger">
          {entries.length === 0 ? (
            <p className="small muted">No entries for {app.symbol} yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>At</th>
                    <th>Entry</th>
                    <th>Rationale</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((d, i) => (
                    <tr key={d.id}>
                      <td className="tiny">{clock(d.at)}</td>
                      <td>
                        <DecisionBadge d={d} />
                        {i === 0 && <div className="tiny muted">CURRENT</div>}
                      </td>
                      <td className="small">{d.rationale}</td>
                      <td className="tiny">{d.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
      <aside className="stack">
        <AppPicker apps={props.apps} value={app.id} onSelect={props.onSelect} />
        <div className="data-grid cols-2">
          <DataCell label="Score" value={score.data ? `${totalScore(score.data)}/${MAX}` : score.loading ? '…' : '—'} sub={score.data ? clock(score.data.updated_at) : 'not scored'} />
          <DataCell label="Entries" value={entries.length} />
        </div>
      </aside>
    </div>
  )
}

function Schedule({ apps, current, slots, error, onChange }: { apps: Application[]; current: Map<string, Decision>; slots: Slot[] | undefined; error: Error | undefined; onChange: () => void }) {
  const recommended = apps.filter((a) => current.get(a.id)?.decision === 'RECOMMEND')
  const [appId, setAppId] = useState('')
  const [date, setDate] = useState(() => new Date(Date.now() + 86400_000).toISOString().slice(0, 10))
  const [lane, setLane] = useState<Slot['lane']>('FEATURED')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pick = appId || recommended[0]?.id || ''

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setErr(null)
    try {
      await fn()
      onChange()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="split">
      <Panel title="Schedule">
        {error ? (
          <ErrorCallout error={error} />
        ) : !slots ? (
          <Reading />
        ) : slots.length === 0 ? (
          <p className="small muted">No slots booked.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lane</th>
                  <th>Token</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => {
                  const a = apps.find((x) => x.id === s.application_id)
                  return (
                    <tr key={s.id}>
                      <td className="mono">{s.date}</td>
                      <td>
                        <Badge tone="accent">{s.lane}</Badge>
                      </td>
                      <td className="mono">{a?.symbol ?? s.application_id}</td>
                      <td className="num">
                        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act(() => curateApi.removeSlot(s.id))}>
                          REMOVE
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel title="Book a slot">
        {recommended.length === 0 ? (
          <p className="small muted">Only recommended applications can be scheduled. Record a recommendation first.</p>
        ) : (
          <>
            <Field label="Recommended token" htmlFor="slot-app">
              <select id="slot-app" className="input" value={pick} onChange={(e) => setAppId(e.target.value)}>
                {recommended.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.symbol}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date" htmlFor="slot-date">
              <input id="slot-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Lane" htmlFor="slot-lane">
              <select id="slot-lane" className="input" value={lane} onChange={(e) => setLane(e.target.value as Slot['lane'])}>
                <option>FEATURED</option>
                <option>SPOTLIGHT</option>
                <option>NEWSLETTER</option>
              </select>
            </Field>
            <button className="btn btn-primary btn-block" disabled={busy || !pick || !date} onClick={() => act(() => curateApi.addSlot({ application_id: pick, date, lane }))}>
              {busy ? 'BOOKING…' : 'BOOK SLOT →'}
            </button>
          </>
        )}
        {err && <Notice tone="error">{err}</Notice>}
      </Panel>
    </div>
  )
}

function Monitor({ apps, current, slots }: { apps: Application[]; current: Map<string, Decision>; slots: Slot[] }) {
  const { backend, version } = useWallet()
  const watched = apps.filter((a) => current.get(a.id)?.decision === 'RECOMMEND' || slots.some((s) => s.application_id === a.id))
  const data = useAsync(async () => {
    const tokens: TokenInfo[] = await backend.getTokens(0, 200)
    return Promise.all(
      watched.map(async (a) => {
        const t = tokens.find((x) => x.symbol === a.symbol)
        const c = t?.curve_account ? await backend.getCurve(t.curve_account).catch(() => null) : null
        return { a, t, c }
      }),
    )
  }, [backend, version, watched.map((a) => a.id).join()])

  return (
    <Panel title="NEAR monitor · read-only" actions={<button className="btn btn-ghost btn-sm" onClick={data.reload}>{data.loading ? 'READING…' : 'REFRESH'}</button>}>
      <p className="tiny muted">RECOMMENDED OR SCHEDULED TOKENS · VIEW CALLS ONLY · {backend.kind === 'fake' ? 'SIMULATED CHAIN' : CONFIG.rpcUrl}</p>
      {watched.length === 0 ? (
        <p className="small muted">Nothing recommended or scheduled yet.</p>
      ) : data.error ? (
        <ErrorCallout error={data.error} onRetry={data.reload} />
      ) : !data.data ? (
        <Reading />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Token</th>
                <th>On chain</th>
                <th>Curve</th>
                <th className="num">Units sold / s</th>
                <th>Pool</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map(({ a, t, c }) => (
                <tr key={a.id}>
                  <td className="mono">{a.symbol}</td>
                  <td>{t ? <Badge tone="lime">FOUND</Badge> : <Badge tone="negative">NOT DEPLOYED</Badge>}</td>
                  <td>{c ? <StatusBadge status={c.status} /> : t && !t.curve_account ? <Badge>PLAIN</Badge> : '—'}</td>
                  <td className="num">{c ? `${groupInt(c.units_sold)} / ${groupInt(c.s)}` : '—'}</td>
                  <td className="tiny">{c?.migrated_to_pool ? `${c.migrated_to_pool} #${c.pool_id}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
