// Curator console data. VITE_CURATE_API=1 → /api (Vite proxies to :4123 and injects
// TYPESAFE_API_KEY server-side, so the key never ships in the bundle). Otherwise in-memory demo.

import { CONFIG } from '../../lib/config'

export interface Application {
  id: string
  symbol: string
  project: string
  contact: string
  summary: string
  links: string[]
  submitted_at: number
}

export const QUESTIONS = [
  { id: 'team', q: 'Is the team identifiable and reachable?' },
  { id: 'purpose', q: 'Does the token have a reason to exist beyond speculation?' },
  { id: 'params', q: 'Are the curve parameters (s, p0 → p1) sane for the target market cap?' },
  { id: 'demand', q: 'Is there organic community demand, not botted?' },
  { id: 'fees', q: 'Is the fee / tax choice explained to holders?' },
  { id: 'risk', q: 'Are risks disclosed honestly?' },
] as const
export type QuestionId = (typeof QUESTIONS)[number]['id']
export const MAX_PER_Q = 3

export interface Score {
  application_id: string
  answers: Partial<Record<QuestionId, number>>
  notes: string
  updated_at: number
}

export type DecisionKind = 'RECOMMEND' | 'NOT_RECOMMEND'

/** Append-only. The latest entry per application is current; nothing is edited or deleted. */
export interface Decision {
  id: string
  application_id: string
  decision: DecisionKind
  rationale: string
  by: string
  at: number
}

export interface Slot {
  id: string
  application_id: string
  date: string
  lane: 'FEATURED' | 'SPOTLIGHT' | 'NEWSLETTER'
}

export interface CurateApi {
  readonly remote: boolean
  applications(): Promise<Application[]>
  score(id: string): Promise<Score | null>
  saveScore(s: Omit<Score, 'updated_at'>): Promise<Score>
  decisions(): Promise<Decision[]>
  decide(d: Omit<Decision, 'id' | 'at'>): Promise<Decision>
  schedule(): Promise<Slot[]>
  addSlot(s: Omit<Slot, 'id'>): Promise<Slot>
  removeSlot(id: string): Promise<void>
}

class HttpCurate implements CurateApi {
  readonly remote = true
  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`/api${path}`, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } })
    if (!r.ok) {
      const body = await r.text().catch(() => '')
      throw new Error(`/api${path} → ${r.status} ${r.statusText}${body ? `: ${body.slice(0, 200)}` : ''}`)
    }
    return r.status === 204 ? (undefined as T) : ((await r.json()) as T)
  }
  applications() { return this.req<Application[]>('/applications') }
  score(id: string) { return this.req<Score | null>(`/applications/${encodeURIComponent(id)}/score`) }
  saveScore(s: Omit<Score, 'updated_at'>) {
    return this.req<Score>(`/applications/${encodeURIComponent(s.application_id)}/score`, { method: 'PUT', body: JSON.stringify(s) })
  }
  decisions() { return this.req<Decision[]>('/decisions') }
  decide(d: Omit<Decision, 'id' | 'at'>) { return this.req<Decision>('/decisions', { method: 'POST', body: JSON.stringify(d) }) }
  schedule() { return this.req<Slot[]>('/schedule') }
  addSlot(s: Omit<Slot, 'id'>) { return this.req<Slot>('/schedule', { method: 'POST', body: JSON.stringify(s) }) }
  removeSlot(id: string) { return this.req<void>(`/schedule/${encodeURIComponent(id)}`, { method: 'DELETE' }) }
}

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms))
let seq = 100
const nid = (p: string) => `${p}_${(seq++).toString(36)}`

class MemoryCurate implements CurateApi {
  readonly remote = false
  private apps: Application[]
  private scores = new Map<string, Score>()
  private ledger: Decision[] = []
  private slots: Slot[] = []

  constructor() {
    const now = Date.now()
    const d = 86400_000
    this.apps = [
      { id: 'app_neb', symbol: 'NEBULAE69M', project: 'Nebulae Collective', contact: 'ops@nebulae.example', summary: 'Generative star-map art community; tax mode to fund weekly drops.', links: ['https://nebulae.example'], submitted_at: now - 4 * d },
      { id: 'app_krl', symbol: 'KRILL', project: 'Krill Swarm', contact: '@krillswarm', summary: 'Meme token for an ocean-cleanup Discord. No roadmap yet.', links: [], submitted_at: now - 2 * d },
      { id: 'app_mos', symbol: 'MOSSDAO', project: 'Moss DAO', contact: 'gov@moss.example', summary: 'Grant DAO for urban green roofs. Migrating from legacy fixed-price sale.', links: ['https://moss.example/dao'], submitted_at: now - 6 * d },
      { id: 'app_orb', symbol: 'ORBITCAT', project: 'Orbit Cat', contact: '@orbitcat', summary: 'Sold out in 31 hours. Asking for graduation spotlight.', links: ['https://x.example/orbitcat'], submitted_at: now - 1 * d },
    ]
    this.scores.set('app_neb', { application_id: 'app_neb', answers: { team: 3, purpose: 2, params: 3, demand: 2, fees: 3, risk: 2 }, notes: 'Doxxed team, clear tax rationale.', updated_at: now - 3 * d })
    this.ledger.push({ id: nid('dec'), application_id: 'app_neb', decision: 'RECOMMEND', rationale: 'Strong on team + fee disclosure.', by: 'curator.testnet', at: now - 3 * d })
    this.ledger.push({ id: nid('dec'), application_id: 'app_mos', decision: 'NOT_RECOMMEND', rationale: 'Waiting on legacy refund plan.', by: 'curator.testnet', at: now - 5 * d })
    this.slots.push({ id: nid('slot'), application_id: 'app_neb', date: new Date(now + 2 * d).toISOString().slice(0, 10), lane: 'FEATURED' })
  }

  async applications() { await wait(); return [...this.apps].sort((a, b) => b.submitted_at - a.submitted_at) }
  async score(id: string) { await wait(200); return this.scores.get(id) ?? null }
  async saveScore(s: Omit<Score, 'updated_at'>) {
    await wait()
    const v = { ...s, updated_at: Date.now() }
    this.scores.set(s.application_id, v)
    return v
  }
  async decisions() { await wait(250); return [...this.ledger] }
  async decide(d: Omit<Decision, 'id' | 'at'>) {
    await wait()
    if (!d.rationale.trim()) throw new Error('A rationale is required for every ledger entry.')
    const v = { ...d, id: nid('dec'), at: Date.now() }
    this.ledger.push(v)
    return v
  }
  async schedule() { await wait(250); return [...this.slots].sort((a, b) => a.date.localeCompare(b.date)) }
  async addSlot(s: Omit<Slot, 'id'>) {
    await wait()
    if (this.slots.some((x) => x.date === s.date && x.lane === s.lane)) throw new Error(`${s.lane} on ${s.date} is already taken.`)
    const v = { ...s, id: nid('slot') }
    this.slots.push(v)
    return v
  }
  async removeSlot(id: string) { await wait(); this.slots = this.slots.filter((s) => s.id !== id) }
}

export const curateApi: CurateApi = CONFIG.curateApi ? new HttpCurate() : new MemoryCurate()

export function totalScore(s: Score | null | undefined): number {
  if (!s) return 0
  return Object.values(s.answers).reduce<number>((a, b) => a + (b ?? 0), 0)
}

/** Latest decision per application (ledger is append-only). */
export function currentDecisions(ledger: Decision[]): Map<string, Decision> {
  const m = new Map<string, Decision>()
  for (const d of [...ledger].sort((a, b) => a.at - b.at)) m.set(d.application_id, d)
  return m
}
