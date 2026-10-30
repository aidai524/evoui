import { useCallback, useEffect, useState } from 'react'
import { Decor, Footer, Subnav, Topbar, type LaunchTab, type Section } from './components/Shell'
import type { TokenInfo } from './lib/types'
import { Create } from './sections/create/Create'
import { Curate } from './sections/curate/Curate'
import { Curve } from './sections/launch/Curve'
import { Launches } from './sections/launch/Launches'
import { Allocation, Commit, LegacyClaim } from './sections/launch/Legacy'
import { useWallet } from './wallet/WalletProvider'

export default function App() {
  const { backend } = useWallet()
  const [section, setSection] = useState<Section>('launch')
  const [tab, setTab] = useState<LaunchTab>('launches')
  const [curveToken, setCurveToken] = useState<TokenInfo | null>(null)

  // Block body: newer browsers return a Promise from scrollTo, which must not reach React as a cleanup.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [section, tab, curveToken?.symbol])

  const openCurve = useCallback((t: TokenInfo) => {
    setCurveToken(t)
    setSection('launch')
    setTab('curve')
  }, [])

  // After Create: jump to the new token's curve page, or the list for a plain mint.
  const viewCreated = useCallback(
    async (symbol: string) => {
      setSection('launch')
      const t = (await backend.getTokens(0, 200).catch(() => [])).find((x) => x.symbol === symbol)
      if (t?.curve_account) openCurve(t)
      else setTab('launches')
    },
    [backend, openCurve],
  )

  return (
    <div className="shell">
      <Decor />
      <Topbar section={section} onSection={setSection} />
      {section === 'launch' && <Subnav tab={tab} onTab={setTab} curveSymbol={curveToken?.symbol ?? null} />}
      <main className="main" id="main">
        {section === 'launch' && tab === 'launches' && <Launches onOpenCurve={openCurve} onCreate={() => setSection('create')} />}
        {section === 'launch' && tab === 'curve' && <Curve token={curveToken} onPick={openCurve} onBrowse={() => setTab('launches')} />}
        {section === 'launch' && tab === 'commit' && <Commit />}
        {section === 'launch' && tab === 'claim' && <LegacyClaim />}
        {section === 'launch' && tab === 'allocation' && <Allocation />}
        {section === 'create' && <Create onView={viewCreated} />}
        {section === 'curate' && <Curate />}
      </main>
      <Footer />
    </div>
  )
}
