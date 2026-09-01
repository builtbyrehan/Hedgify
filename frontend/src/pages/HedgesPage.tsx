import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboard } from '../context/DashboardContext'
import StatusBadge from '../components/shared/StatusBadge'
import EmptyState from '../components/shared/EmptyState'

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

export default function HedgesPage() {
  const { hedges } = useDashboard()
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
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${
            activeTab === tab.key
              ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}>
            <span className="flex items-center gap-1.5">
              {tab.label}
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${activeTab === tab.key ? 'bg-[var(--color-bg-active)] text-[var(--color-text-primary)]' : 'bg-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]'}`}>
                {tab.count}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="card p-5">
        <div className="label mb-4">
          {activeTab === 'active' ? 'Active Hedges' : activeTab === 'expired' ? 'Expired Hedges' : 'All Hedges'}
        </div>

        {filteredHedges.length === 0 ? (
          <EmptyState context="hedges" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left label pb-2.5 pr-4 font-normal">Symbol</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Type</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Strike Price</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Expiry</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Premium Paid</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Status</th>
                  <th className="text-left label pb-2.5 font-normal">Protection Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredHedges.map(hedge => {
                  const isExpanded = expandedId === hedge.id
                  const days = daysUntil(hedge.expiry)
                  const protectionValue = hedge.strike * 100

                  return (
                    <motion.tr key={hedge.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-[var(--color-border-subtle)] last:border-0">
                      <td colSpan={7} className="p-0">
                        <div onClick={() => setExpandedId(prev => prev === hedge.id ? null : hedge.id)} className="flex items-center py-2.5 px-0 cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors rounded-lg">
                          <div className="w-[14%] pr-4">
                            <span className="font-medium text-[var(--color-text-primary)]">{hedge.symbol}</span>
                          </div>
                          <div className="w-[12%] pr-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-hover)]">
                              Protective Put
                            </span>
                          </div>
                          <div className="w-[14%] pr-4">
                            <span className="font-mono font-semibold text-[var(--color-text-primary)]">${hedge.strike.toFixed(2)}</span>
                          </div>
                          <div className="w-[18%] pr-4">
                            <div className="font-mono text-[var(--color-text-secondary)] text-[12px]">{formatDate(hedge.expiry)}</div>
                            <div className={`font-mono text-[11px] mt-0.5 ${days <= 3 ? 'text-[var(--color-danger)] font-medium' : days <= 7 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-tertiary)]'}`}>
                              {days} days left
                            </div>
                          </div>
                          <div className="w-[14%] pr-4">
                            <span className="font-mono font-medium" style={{ color: 'var(--color-warning)' }}>${(hedge.premium ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="w-[14%] pr-4">
                            <StatusBadge status={hedge.status} />
                          </div>
                          <div className="w-[14%] flex items-center justify-between">
                            <span className="font-mono font-semibold text-[var(--color-text-primary)]">${protectionValue.toLocaleString()}</span>
                            <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.15 }} className="text-[var(--color-text-tertiary)] text-[11px] ml-2">▾</motion.span>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              <div className="px-4 pb-4 pt-1 ml-4 border-l-2 border-[var(--color-border)]">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                                    <div className="label mb-1">Order ID</div>
                                    <div className="text-[12px] font-mono text-[var(--color-text-primary)] break-all">
                                      {typeof hedge.id === 'string' ? hedge.id : `#${hedge.id}`}
                                    </div>
                                  </div>
                                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                                    <div className="label mb-1">Triggering Alert</div>
                                    <div className="text-[12px] font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text-primary)] transition-colors">
                                      {hedge.symbol} drawdown alert
                                    </div>
                                  </div>
                                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                                    <div className="label mb-1">Days to Expiry</div>
                                    <div className={`text-[18px] font-semibold ${days <= 3 ? 'text-[var(--color-danger)]' : days <= 7 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}`}>
                                      {days}
                                    </div>
                                    <div className="text-[11px] text-[var(--color-text-tertiary)]">of 14 days</div>
                                  </div>
                                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                                    <div className="label mb-1">Break-Even Price</div>
                                    <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                                      ${(hedge.strike - (hedge.premium ?? 0) / 100).toFixed(2)}
                                    </div>
                                    <div className="text-[11px] text-[var(--color-text-tertiary)]">strike − premium/100</div>
                                  </div>
                                </div>
                                <div className="mt-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3 inline-block">
                                  <div className="label mb-1">Max Loss Protected</div>
                                  <div className="text-[18px] font-semibold text-[var(--color-text-primary)]">
                                    ${((hedge.strike * 100) - (hedge.premium ?? 0)).toLocaleString()}
                                  </div>
                                  <div className="text-[11px] text-[var(--color-text-tertiary)]">strike × 100 − premium</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hedges.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[var(--color-text-tertiary)]">
          <span>Total Protection: <span className="font-medium text-[var(--color-text-secondary)]">${filteredHedges.reduce((sum, h) => sum + (h.strike * 100), 0).toLocaleString()}</span></span>
          <span>Total Premium: <span className="font-medium" style={{ color: 'var(--color-warning)' }}>${filteredHedges.reduce((sum, h) => sum + (h.premium ?? 0), 0).toLocaleString()}</span></span>
          <span>Avg Break-Even: <span className="font-medium text-[var(--color-text-secondary)]">${filteredHedges.length > 0 ? (filteredHedges.reduce((sum, h) => sum + h.strike - (h.premium ?? 0) / 100, 0) / filteredHedges.length).toFixed(2) : '0.00'}</span></span>
        </div>
      )}
    </div>
  )
}
