import type { ReactNode } from 'react'
import { CONFIG } from '../lib/config'
import { useWallet } from '../wallet/WalletProvider'
import { WalletChip } from './WalletChip'

export type Section = 'launch' | 'create' | 'curate'
export type LaunchTab = 'launches' | 'curve' | 'commit' | 'claim' | 'allocation'

export function Decor() {
  return (
    <div className="decor" aria-hidden="true">
      <div className="decor-watermark">UNIZAT_ · BONDING CURVE · NEAR TESTNET</div>
      <span className="decor-cross tr">+</span>
      <span className="decor-cross bl">+</span>
      <span className="decor-scene">1/SCN_01</span>
    </div>
  )
}

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'launch', label: 'Launch' },
  { id: 'create', label: 'Create' },
  { id: 'curate', label: 'Curate' },
]

export function Topbar({ section, onSection }: { section: Section; onSection: (s: Section) => void }) {
  const { mode } = useWallet()
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={() => onSection('launch')} aria-label="UNIZAT home">
          <span className="brand-yen">¥</span>
          <span>
            UNIZAT<span className="cursor">_</span>
          </span>
        </button>
        <nav className="nav" aria-label="Primary">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className="nav-item"
              aria-current={section === s.id ? 'page' : undefined}
              onClick={() => onSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <div className="topbar-right">
          <span className={`status ${mode === 'simulated' ? 'status-simulated' : 'status-online'} hide-sm`}>
            {mode === 'simulated' ? 'sim' : mode === 'intents' ? 'intents' : CONFIG.networkId}
          </span>
          <WalletChip />
        </div>
      </div>
    </header>
  )
}

const TABS: { id: LaunchTab; label: string; legacy?: boolean }[] = [
  { id: 'launches', label: 'Launches' },
  { id: 'curve', label: 'Curve' },
  { id: 'commit', label: 'Commit', legacy: true },
  { id: 'claim', label: 'Claim', legacy: true },
  { id: 'allocation', label: 'Allocation', legacy: true },
]

export function Subnav({ tab, onTab, curveSymbol }: { tab: LaunchTab; onTab: (t: LaunchTab) => void; curveSymbol: string | null }) {
  return (
    <div className="subnav">
      <div className="subnav-inner" role="tablist" aria-label="Launch">
        {TABS.map((t, i) => (
          <span key={t.id} style={{ display: 'contents' }}>
            {t.legacy && !TABS[i - 1]?.legacy && <span className="subtab-sep" aria-hidden="true" />}
            <button role="tab" className="subtab" aria-selected={tab === t.id} onClick={() => onTab(t.id)}>
              {t.label}
              {t.id === 'curve' && curveSymbol && <span className="legacy-tag">/{curveSymbol}</span>}
              {t.legacy && <span className="legacy-tag">legacy</span>}
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

export function Footer() {
  const { mode, backend } = useWallet()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>¥ UNIZAT_ · factory {CONFIG.factory}</span>
        <span>backend {backend.kind === 'fake' ? 'in-memory simulation' : CONFIG.rpcUrl.replace('https://', '')}</span>
        <span>wallet {mode}</span>
        <span>only aggregates are public — no attribution</span>
      </div>
    </footer>
  )
}

export function PageHead({ eyebrow, title, lede, aside }: { eyebrow: string; title: ReactNode; lede?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="hero-title">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {aside}
    </div>
  )
}
