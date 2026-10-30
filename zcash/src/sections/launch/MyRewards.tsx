import { DataCell, ErrorCallout, Notice, Panel, Reading } from '../../components/ui'
import { CONFIG, nearblocks, TAX } from '../../lib/config'
import { bpsToPct, clock, fromAtoms, groupInt, relTime, shortHex } from '../../lib/format'
import { useAsync, useNow } from '../../lib/hooks'
import type { TokenInfo } from '../../lib/types'
import { useWallet } from '../../wallet/WalletProvider'

const zec = (atoms: string) => `${fromAtoms(atoms, TAX.rewardDecimals, 8)} ${TAX.rewardSymbol}`

/** "My wZEC rewards" for one tax-mode token: cumulative bot payouts, next run, holding share. */
export function MyRewards({ token, compact }: { token: TokenInfo; compact?: boolean }) {
  const { backend, session, version } = useWallet()
  const now = useNow(1000)
  const r = useAsync(
    () => (session ? backend.getRewards(session.accountId, session.idCommitment, token) : Promise.resolve(null)),
    [backend, session?.accountId, session?.idCommitment, token.symbol, version],
  )

  const title = (
    <>
      My {TAX.rewardSymbol} rewards <span className="muted">· {token.symbol}</span>
    </>
  )

  if (!session) {
    return (
      <Panel title={title}>
        <Notice tag="READ-ONLY">Connect a wallet to see rewards distributed to your account.</Notice>
      </Panel>
    )
  }

  const next = r.data?.next_distribution_at
  // Keep the countdown honest between reloads: roll forward by whole intervals.
  const nextAt = next != null ? (next > now ? next : next + Math.ceil((now - next) / TAX.distributionIntervalMs) * TAX.distributionIntervalMs) : null

  return (
    <Panel
      title={title}
      actions={
        <button className="btn btn-ghost btn-sm" onClick={r.reload} disabled={r.loading}>
          {r.loading ? 'READING…' : 'REFRESH'}
        </button>
      }
    >
      {r.error ? (
        <ErrorCallout error={r.error} onRetry={r.reload} />
      ) : !r.data ? (
        <Reading />
      ) : (
        <>
          <div className="data-grid cols-3">
            <DataCell label="Accumulated" value={fromAtoms(r.data.total, TAX.rewardDecimals, 6)} sub={`${TAX.rewardSymbol} distributed to you`} />
            <DataCell
              label="Next distribution"
              value={nextAt ? relTime(nextAt) : '—'}
              sub={nextAt ? clock(nextAt) : 'bot schedule unknown'}
            />
            <DataCell label="Units held" value={groupInt(r.data.units)} sub={`${bpsToPct(r.data.share_bps)} of circulating`} />
          </div>
          <p className="tiny muted">
            {bpsToPct(TAX.holdersBps)} OF EVERY TRANSFER IS SWAPPED TO {TAX.rewardSymbol.toUpperCase()} ({TAX.rewardAsset}) AND SPLIT PRO RATA BY A CENTRALISED BOT EVERY{' '}
            {TAX.distributionIntervalMs / 60000} MIN.
            {r.data.balance != null && ` WALLET BALANCE ${zec(r.data.balance)}.`}
          </p>
          {!compact && r.data.history.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th className="num">Amount</th>
                    <th>Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {r.data.history.slice(0, 12).map((e) => (
                    <tr key={`${e.at}-${e.hash}`}>
                      <td className="tiny">{clock(e.at)}</td>
                      <td className="num">{zec(e.amount)}</td>
                      <td className="tiny">
                        {e.hash ? (
                          <a href={nearblocks.tx(e.hash)} target="_blank" rel="noreferrer">
                            {shortHex(e.hash, 6)} ↗
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!compact && r.data.history.length === 0 && (
            <p className="small muted">
              No distributions yet{backend.kind === 'near' && !CONFIG.rewardsIndexer ? ' — set VITE_NOIR_REWARDS_INDEXER to read bot history' : ''}.
            </p>
          )}
        </>
      )}
    </Panel>
  )
}
