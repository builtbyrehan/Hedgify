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
  const now = Date.now()
  return Math.max(0, Math.ceil((exp - now) / 86400000))
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

  function toggleExpand(id: string | number) {
    setExpandedId(prev => prev === id ? null : id)
  }

  const cardClass = 'rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6'

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-cyan/10 text-cyan border border-cyan/20 shadow-lg shadow-cyan/5'
                : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-cyan/15 text-cyan'
                  : 'bg-white/[0.06] text-text-dim'
              }`}>
                {tab.count}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Hedges Table */}
      <div className={cardClass}>
        <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-4">
          {activeTab === 'active' ? 'Active Hedges' : activeTab === 'expired' ? 'Expired Hedges' : 'All Hedges'}
        </div>

        {filteredHedges.length === 0 ? (
          <EmptyState context="hedges" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Symbol</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Type</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Strike Price</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Expiry</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Premium Paid</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Status</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3">Protection Value</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredHedges.map((hedge) => {
                    const isExpanded = expandedId === hedge.id
                    const days = daysUntil(hedge.expiry)
                    const protectionValue = hedge.strike * 100

                    return (
                      <motion.tr
                        key={hedge.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-white/[0.04]"
                      >
                        <td colSpan={7} className="p-0">
                          {/* Main Row */}
                          <div
                            onClick={() => toggleExpand(hedge.id)}
                            className="flex items-center py-3 px-0 cursor-pointer hover:bg-white/[0.02] transition-colors rounded-lg"
                          >
                            <div className="w-[14%] pr-4">
                              <span className="text-text-primary font-display font-bold">{hedge.symbol}</span>
                            </div>
                            <div className="w-[12%] pr-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet/[0.08] border border-violet/20 text-violet text-[10px] font-mono font-bold">
                                <span>🛡</span>Protective Put
                              </span>
                            </div>
                            <div className="w-[14%] pr-4">
                              <span className="text-text-primary font-display font-black text-sm">${hedge.strike.toFixed(2)}</span>
                            </div>
                            <div className="w-[18%] pr-4">
                              <div className="font-mono text-text-muted text-xs">{formatDate(hedge.expiry)}</div>
                              <div className={`font-mono text-[10px] mt-0.5 ${days <= 3 ? 'text-danger font-bold' : days <= 7 ? 'text-gold' : 'text-text-dim'}`}>
                                {days} days left
                              </div>
                            </div>
                            <div className="w-[14%] pr-4">
                              <span className="font-mono text-gold font-bold">${(hedge.premium ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="w-[14%] pr-4 flex items-center gap-2">
                              {hedge.status === 'active' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30" />
                              )}
                              <StatusBadge status={hedge.status} />
                            </div>
                            <div className="w-[14%] flex items-center justify-between">
                              <span className="font-mono text-text-primary font-bold">${protectionValue.toLocaleString()}</span>
                              <motion.span
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-text-dim text-xs ml-2"
                              >
                                ▾
                              </motion.span>
                            </div>
                          </div>

                          {/* Expanded Row */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-1 ml-4 border-l-2 border-violet/20">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                      <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Order ID</div>
                                      <div className="text-text-primary font-mono text-xs break-all">
                                        {typeof hedge.id === 'string' ? hedge.id : `#${hedge.id}`}
                                      </div>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                      <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Triggering Alert</div>
                                      <div className="text-cyan font-mono text-xs hover:underline cursor-pointer">
                                        {hedge.symbol} drawdown alert
                                      </div>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                      <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Days to Expiry</div>
                                      <div className={`font-display font-black text-lg ${days <= 3 ? 'text-danger' : days <= 7 ? 'text-gold' : 'text-text-primary'}`}>
                                        {days}
                                      </div>
                                      <div className="text-text-dim text-[10px] font-mono">of 14 days</div>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                      <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Break-Even Price</div>
                                      <div className="text-text-primary font-display font-bold text-sm">
                                        ${(hedge.strike - (hedge.premium ?? 0) / 100).toFixed(2)}
                                      </div>
                                      <div className="text-text-dim text-[10px] font-mono">strike − premium/100</div>
                                    </div>
                                  </div>
                                  <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 inline-block">
                                    <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Max Loss Protected</div>
                                    <div className="text-emerald-400 font-display font-black text-lg">
                                      ${((hedge.strike * 100) - (hedge.premium ?? 0)).toLocaleString()}
                                    </div>
                                    <div className="text-text-dim text-[10px] font-mono">strike × 100 − premium</div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {hedges.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-text-dim">
          <span>
            Total Protection:{' '}
            <span className="text-text-muted font-bold">
              ${filteredHedges.reduce((sum, h) => sum + (h.strike * 100), 0).toLocaleString()}
            </span>
          </span>
          <span>
            Total Premium:{' '}
            <span className="text-gold font-bold">
              ${filteredHedges.reduce((sum, h) => sum + (h.premium ?? 0), 0).toLocaleString()}
            </span>
          </span>
          <span>
            Avg Break-Even:{' '}
            <span className="text-text-muted font-bold">
              ${filteredHedges.length > 0
                ? (filteredHedges.reduce((sum, h) => sum + h.strike - (h.premium ?? 0) / 100, 0) / filteredHedges.length).toFixed(2)
                : '0.00'
              }
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
