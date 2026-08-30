import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboard } from '../context/DashboardContext'
import EmptyState from '../components/shared/EmptyState'
import type { LogEntry } from '../types'

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch { return '--:--:--' }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

const severityConfig: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  info: { color: 'text-cyan', bg: 'bg-cyan/[0.06]', border: 'border-cyan/20', dot: 'bg-cyan' },
  warning: { color: 'text-gold', bg: 'bg-gold/[0.06]', border: 'border-gold/20', dot: 'bg-gold' },
  error: { color: 'text-danger', bg: 'bg-danger/[0.06]', border: 'border-danger/20', dot: 'bg-danger' },
}

const agentConfig: Record<string, { color: string; bg: string; border: string }> = {
  Monitor: { color: 'text-cyan', bg: 'bg-cyan/[0.08]', border: 'border-cyan/20' },
  Executor: { color: 'text-violet', bg: 'bg-violet/[0.08]', border: 'border-violet/20' },
}

const MOCK_LOGS: LogEntry[] = [
  {
    id: 'mock-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    agent: 'Monitor',
    event_type: 'Portfolio Check',
    message: 'Portfolio drawdown at 1.82%, below 2.00% threshold. No action required.',
    severity: 'info',
  },
  {
    id: 'mock-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    agent: 'Monitor',
    event_type: 'Drawdown Alert',
    message: 'AAPL drawdown breached 2.00% threshold (2.34%). Alert fired.',
    severity: 'warning',
  },
  {
    id: 'mock-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    agent: 'Executor',
    event_type: 'Hedge Placed',
    message: 'Protective put order filled: AAPL 5% OTM, 14-day expiry, $50.00 premium.',
    severity: 'info',
  },
  {
    id: 'mock-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    agent: 'Executor',
    event_type: 'Order Failed',
    message: 'Broker rejected TSLA put order: insufficient buying power in paper account.',
    severity: 'error',
  },
  {
    id: 'mock-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    agent: 'Monitor',
    event_type: 'Idempotency Guard',
    message: 'Duplicate alert for AAPL skipped (last processed 45s ago). Guard active.',
    severity: 'warning',
  },
]

export default function LogsPage() {
  const { logs: contextLogs } = useDashboard()

  const logs = contextLogs.length > 0 ? contextLogs : MOCK_LOGS

  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = useMemo(() => {
    let result = [...logs]
    if (agentFilter !== 'all') {
      result = result.filter(l => l.agent === agentFilter)
    }
    if (severityFilter !== 'all') {
      result = result.filter(l => l.severity === severityFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(l =>
        l.message.toLowerCase().includes(q) ||
        l.event_type.toLowerCase().includes(q) ||
        l.agent.toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return result
  }, [logs, agentFilter, severityFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1.5 block">Agent</label>
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-cyan/40 transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Agents</option>
            <option value="Monitor">Monitor</option>
            <option value="Executor">Executor</option>
          </select>
        </div>
        <div>
          <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1.5 block">Severity</label>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-cyan/40 transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-1.5 block">Search</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-xs">⌕</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-primary font-mono text-xs pl-8 pr-3 py-2 focus:outline-none focus:border-cyan/40 transition-colors placeholder:text-text-dim"
            />
          </div>
        </div>
      </div>

      {/* System Event Timeline */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase">System Event Timeline</div>
          <div className="text-text-dim text-[10px] font-mono">{filteredLogs.length} events</div>
        </div>

        {filteredLogs.length === 0 ? (
          <EmptyState context="logs" />
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-white/[0.06]" />

            <div className="space-y-1">
              <AnimatePresence>
                {filteredLogs.map((log, i) => {
                  const severity = severityConfig[log.severity] || severityConfig.info
                  const agent = agentConfig[log.agent] || agentConfig.Monitor

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="relative pl-10 py-3 group"
                    >
                      {/* Dot on timeline */}
                      <div className={`absolute left-[10px] top-[18px] w-[11px] h-[11px] rounded-full border-2 border-surface ${severity.dot} shadow-lg z-10`} />

                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                        {/* Time */}
                        <div className="flex-shrink-0 sm:w-[140px]">
                          <div className="font-mono text-text-muted text-xs">{formatTime(log.timestamp)}</div>
                          <div className="font-mono text-text-dim text-[10px]">{timeAgo(log.timestamp)}</div>
                        </div>

                        {/* Agent Badge */}
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${agent.color} ${agent.bg} ${agent.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${severity.dot}`} />
                            {log.agent}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-text-primary font-mono text-xs font-bold">{log.event_type}</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${severity.color} ${severity.bg} border ${severity.border}`}>
                              {log.severity}
                            </span>
                          </div>
                          <div className="text-text-muted text-xs leading-relaxed">{log.message}</div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
