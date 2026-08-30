import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboard } from '../context/DashboardContext'
import StatusBadge from '../components/shared/StatusBadge'
import EmptyState from '../components/shared/EmptyState'
import type { Alert } from '../types'

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch { return '--:--:--' }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '--' }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

export default function AlertsPage() {
  const { alerts, portfolio } = useDashboard()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [symbolFilter, setSymbolFilter] = useState<string>('all')
  const [sortDesc, setSortDesc] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [rawJsonOpen, setRawJsonOpen] = useState(false)

  const stats = useMemo(() => {
    const total = alerts.length
    const processed = alerts.filter(a => a.status === 'processed').length
    const skipped = alerts.filter(a => a.status === 'skipped').length
    const failed = alerts.filter(a => a.status === 'failed').length
    return { total, processed, skipped, failed }
  }, [alerts])

  const symbols = useMemo(() => {
    const set = new Set(alerts.map(a => a.symbol))
    return Array.from(set).sort()
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    let result = [...alerts]
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter)
    }
    if (symbolFilter !== 'all') {
      result = result.filter(a => a.symbol === symbolFilter)
    }
    result.sort((a, b) => {
      const da = new Date(a.timestamp).getTime()
      const db = new Date(b.timestamp).getTime()
      return sortDesc ? db - da : da - db
    })
    return result
  }, [alerts, statusFilter, symbolFilter, sortDesc])

  function openDetail(alert: Alert) {
    setSelectedAlert(alert)
    setModalOpen(true)
    setRawJsonOpen(false)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedAlert(null)
    setRawJsonOpen(false)
  }

  const cardClass = 'rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5'

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cardClass}
        >
          <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-2">Total Alerts</div>
          <div className="text-text-primary font-display font-black text-2xl sm:text-3xl">{stats.total}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className={cardClass}
        >
          <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-2">Processed</div>
          <div className="text-emerald-400 font-display font-black text-2xl sm:text-3xl">{stats.processed}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-gold/30 bg-gold/[0.06] backdrop-blur-sm p-5"
        >
          <div className="text-gold text-[10px] font-mono font-bold tracking-wider uppercase mb-2">Skipped / Idempotency</div>
          <div className="text-gold font-display font-black text-2xl sm:text-3xl">{stats.skipped}</div>
          <div className="text-gold/60 text-[10px] font-mono mt-1">duplicate guard active</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className={cardClass}
        >
          <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-2">Failed</div>
          <div className="text-danger font-display font-black text-2xl sm:text-3xl">{stats.failed}</div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1.5 block">Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-cyan/40 transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="fired">Fired</option>
            <option value="processed">Processed</option>
            <option value="skipped">Skipped</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1.5 block">Symbol</label>
          <select
            value={symbolFilter}
            onChange={e => setSymbolFilter(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-cyan/40 transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Symbols</option>
            {symbols.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto">
          <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1.5 block">Sort</label>
          <button
            onClick={() => setSortDesc(prev => !prev)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-muted font-mono text-xs px-3 py-2 hover:bg-white/[0.06] hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <span>Time</span>
            <span className="text-cyan">{sortDesc ? '↓' : '↑'}</span>
          </button>
        </div>
      </div>

      {/* Alert History Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6">
        <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-4">Alert History</div>

        {filteredAlerts.length === 0 ? (
          <EmptyState context="alerts" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">ID</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Time</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Symbol</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Drawdown</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3 pr-4">Status</th>
                  <th className="text-left text-text-dim font-mono text-[10px] font-bold tracking-wider uppercase pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAlerts.map((alert, i) => (
                    <motion.tr
                      key={alert.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 pr-4 font-mono text-text-dim text-xs">
                        {typeof alert.id === 'string' ? alert.id.slice(0, 12) : `#${alert.id}`}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-mono text-text-muted text-xs">{formatTime(alert.timestamp)}</div>
                        <div className="font-mono text-text-dim text-[10px]">{timeAgo(alert.timestamp)}</div>
                      </td>
                      <td className="py-3 pr-4 font-display font-bold text-text-primary">{alert.symbol}</td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-danger font-bold">
                          -{(alert.drawdown * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 pr-4"><StatusBadge status={alert.status} /></td>
                      <td className="py-3">
                        <button
                          onClick={() => openDetail(alert)}
                          className="rounded-lg border border-cyan/20 bg-cyan/[0.06] text-cyan font-mono text-xs font-bold px-3 py-1.5 hover:bg-cyan/[0.12] hover:border-cyan/30 transition-all"
                        >
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {modalOpen && selectedAlert && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-void/70 backdrop-blur-sm z-50"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 rounded-2xl border border-white/[0.08] bg-surface/95 backdrop-blur-xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div>
                  <div className="text-text-primary font-display font-bold text-sm">Alert Details</div>
                  <div className="text-text-dim font-mono text-xs mt-0.5">{selectedAlert.symbol} — {formatDate(selectedAlert.timestamp)}</div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Alert ID</div>
                    <div className="text-text-primary font-mono text-xs break-all">
                      {typeof selectedAlert.id === 'string' ? selectedAlert.id : `#${selectedAlert.id}`}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Triggered At</div>
                    <div className="text-text-primary font-mono text-xs">{formatTime(selectedAlert.timestamp)}</div>
                    <div className="text-text-dim font-mono text-[10px]">{timeAgo(selectedAlert.timestamp)}</div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Portfolio Value</div>
                    <div className="text-text-primary font-display font-bold text-sm">
                      ${(portfolio?.portfolio_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Peak Value</div>
                    <div className="text-text-primary font-display font-bold text-sm">
                      ${(portfolio?.peak_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Drawdown */}
                <div className="rounded-xl border border-danger/20 bg-danger/[0.04] p-4">
                  <div className="text-danger text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Drawdown at Trigger</div>
                  <div className="text-danger font-display font-black text-3xl">
                    -{(selectedAlert.drawdown * 100).toFixed(2)}%
                  </div>
                  <div className="text-danger/60 text-[10px] font-mono mt-1">threshold breached (≥2.00%)</div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div>
                    <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Status</div>
                    <StatusBadge status={selectedAlert.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1">Symbol</div>
                    <div className="text-text-primary font-display font-bold">{selectedAlert.symbol}</div>
                  </div>
                </div>

                {/* Hedge Result */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-2">Hedge Result</div>
                  {selectedAlert.status === 'processed' ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Protective put placed — 5% OTM, 14-day expiry
                    </div>
                  ) : selectedAlert.status === 'skipped' ? (
                    <div className="flex items-center gap-2 text-gold font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-gold" />
                      Idempotency guard — duplicate alert skipped
                    </div>
                  ) : selectedAlert.status === 'failed' ? (
                    <div className="flex items-center gap-2 text-danger font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-danger" />
                      Order failed — broker rejected or insufficient funds
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-text-muted font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-text-dim" />
                      Pending processing...
                    </div>
                  )}
                </div>

                {/* Raw JSON */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <button
                    onClick={() => setRawJsonOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase hover:text-text-muted transition-colors"
                  >
                    <span>Raw JSON</span>
                    <span className="text-text-dim">{rawJsonOpen ? '▾' : '▸'}</span>
                  </button>
                  <AnimatePresence>
                    {rawJsonOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <pre className="px-3 pb-3 font-mono text-[11px] text-text-muted leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(selectedAlert, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
