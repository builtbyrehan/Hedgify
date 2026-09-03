import { useState, useMemo } from 'react'
import { useDashboard } from '../context/DashboardContext'
import StatusBadge from '../components/shared/StatusBadge'
import EmptyState from '../components/shared/EmptyState'
import type { Hedge } from '../types'

type Tab = 'active' | 'expired' | 'all'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '--' }
}

function daysUntil(expiry: string): number {
  const exp = new Date(expiry).getTime()
  return Math.max(0, Math.ceil((exp - Date.now()) / 86400000))
}

const FALLBACK_HEDGES: Hedge[] = [
  { id: 'h-1', symbol: 'AAPL', strike: 218.50, expiry: '2026-09-15', premium: 48.00, status: 'active', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'h-2', symbol: 'NVDA', strike: 114.00, expiry: '2026-09-18', premium: 72.50, status: 'active', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: 'h-3', symbol: 'MSFT', strike: 410.00, expiry: '2026-08-28', premium: 65.00, status: 'expired', timestamp: new Date(Date.now() - 86400000 * 6).toISOString() },
]

export default function HedgesPage() {
  const { hedges: contextHedges } = useDashboard()
  const hedges = contextHedges.length > 0 ? contextHedges : FALLBACK_HEDGES
  const [activeTab, setActiveTab] = useState<Tab>('active')
  const [expandedId, setExpandedId] = useState<string | number | null>(null)

  const tabs: { key: Tab; label: string; count: number }[] = useMemo(() => [
    { key: 'active', label: 'Active', count: hedges.filter(h => h.status === 'active').length },
    { key: 'expired', label: 'Expired', count: hedges.filter(h => h.status === 'expired' || h.status === 'closed').length },
    { key: 'all', label: 'All', count: hedges.length },
  ], [hedges])

  const filteredHedges = useMemo(() => {
    if (activeTab === 'active') return hedges.filter(h => h.status === 'active')
    if (activeTab === 'expired') return hedges.filter(h => h.status === 'expired' || h.status === 'closed')
    return hedges
  }, [hedges, activeTab])

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="flex items-center gap-1 p-1 rounded-[2px] border w-fit"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                backgroundColor: isActive ? 'var(--surface-raised)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-faint)',
              }}
              className={`px-3 py-1.5 rounded-[2px] text-[12px] font-mono transition-colors duration-100 flex items-center gap-2 ${
                isActive ? 'font-medium' : 'hover:text-[var(--text-dim)]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  backgroundColor: isActive ? 'var(--border)' : 'var(--border-faint)',
                  color: isActive ? 'var(--text)' : 'var(--text-faint)',
                }}
                className="text-[10px] px-1.5 py-0.5 rounded-[2px] tabular-nums"
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Hedges Panel */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="label">
            {activeTab === 'active' ? 'Active protective puts' : activeTab === 'expired' ? 'Expired contracts' : 'All contracts'}
          </span>
          <span className="text-[11px] font-mono text-[var(--text-faint)] tabular-nums">
            {filteredHedges.length} contracts
          </span>
        </div>

        {filteredHedges.length === 0 ? (
          <EmptyState context="hedges" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr style={{ borderColor: 'var(--border-faint)' }} className="border-b">
                  <th className="label pb-2 pr-4 font-normal">Symbol</th>
                  <th className="label pb-2 pr-4 font-normal">Type</th>
                  <th className="label pb-2 pr-4 font-normal">Strike price</th>
                  <th className="label pb-2 pr-4 font-normal">Expiry</th>
                  <th className="label pb-2 pr-4 font-normal">Premium paid</th>
                  <th className="label pb-2 pr-4 font-normal">Status</th>
                  <th className="label pb-2 font-normal text-right">Protection value</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--border-faint)' }} className="divide-y divide-[var(--border-faint)]">
                {filteredHedges.map(hedge => {
                  const isExpanded = expandedId === hedge.id
                  const days = daysUntil(hedge.expiry)
                  const protectionValue = hedge.strike * 100

                  return (
                    <tr
                      key={hedge.id}
                      onClick={() => setExpandedId(prev => prev === hedge.id ? null : hedge.id)}
                      className="hover:bg-[var(--surface-raised)] transition-colors duration-100 cursor-pointer"
                    >
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[13px] text-[var(--text)]">{hedge.symbol}</span>
                          <span className="text-[10px] text-[var(--text-faint)] font-mono">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-[11px] font-mono text-[var(--text-dim)]">
                          Protective Put
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="font-mono font-medium text-[var(--text)] tabular-nums">
                          ${hedge.strike.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="font-mono text-[var(--text)] text-[12px] tabular-nums">{formatDate(hedge.expiry)}</div>
                        <div className={`font-mono text-[10px] tabular-nums ${days <= 3 ? 'text-[var(--negative)]' : days <= 7 ? 'text-[var(--warning)]' : 'text-[var(--text-faint)]'}`}>
                          {days === 0 ? 'expires today' : `${days}d remaining`}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="font-mono text-[var(--text)] tabular-nums">
                          ${hedge.premium ? hedge.premium.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge status={hedge.status} />
                      </td>
                      <td className="py-2.5 text-right font-mono font-medium text-[var(--text)] tabular-nums">
                        ${protectionValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
