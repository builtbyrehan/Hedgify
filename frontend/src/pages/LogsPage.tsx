import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboard } from '../context/DashboardContext'
import EmptyState from '../components/shared/EmptyState'
import Dropdown from '../components/shared/Dropdown'
import type { LogEntry } from '../types'

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch { return '--:--:--' }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

const severityConfig: Record<string, { color: string; bg: string; dot: string }> = {
  info: { color: 'text-[var(--color-text-secondary)]', bg: 'bg-[var(--color-bg-hover)]', dot: 'bg-[var(--color-severity-low)]' },
  warning: { color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning)]/10', dot: 'bg-[var(--color-warning)]' },
  error: { color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger)]/10', dot: 'bg-[var(--color-danger)]' },
}

const agentConfig: Record<string, { color: string; bg: string }> = {
  Monitor: { color: 'text-[var(--color-text-secondary)]', bg: 'bg-[var(--color-bg-hover)]' },
  Executor: { color: 'text-[var(--color-text-primary)]', bg: 'bg-[var(--color-bg-active)]' },
}

const MOCK_LOGS: LogEntry[] = [
  { id: 'mock-1', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), agent: 'Monitor', event_type: 'Portfolio Check', message: 'Portfolio drawdown at 1.82%, below 2.00% threshold. No action required.', severity: 'info' },
  { id: 'mock-2', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), agent: 'Monitor', event_type: 'Drawdown Alert', message: 'AAPL drawdown breached 2.00% threshold (2.34%). Alert fired.', severity: 'warning' },
  { id: 'mock-3', timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(), agent: 'Executor', event_type: 'Hedge Placed', message: 'Protective put order filled: AAPL 5% OTM, 14-day expiry, $50.00 premium.', severity: 'info' },
  { id: 'mock-4', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), agent: 'Executor', event_type: 'Order Failed', message: 'Broker rejected TSLA put order: insufficient buying power in paper account.', severity: 'error' },
  { id: 'mock-5', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), agent: 'Monitor', event_type: 'Idempotency Guard', message: 'Duplicate alert for AAPL skipped (last processed 45s ago). Guard active.', severity: 'warning' },
]

export default function LogsPage() {
  const { logs: contextLogs } = useDashboard()
  const logs = contextLogs.length > 0 ? contextLogs : MOCK_LOGS

  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = useMemo(() => {
    let result = [...logs]
    if (agentFilter !== 'all') result = result.filter(l => l.agent === agentFilter)
    if (severityFilter !== 'all') result = result.filter(l => l.severity === severityFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(l => l.message.toLowerCase().includes(q) || l.event_type.toLowerCase().includes(q) || l.agent.toLowerCase().includes(q))
    }
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return result
  }, [logs, agentFilter, severityFilter, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label mb-1.5 block">Agent</label>
          <Dropdown value={agentFilter} onChange={setAgentFilter} size="sm" options={[
            { value: 'all', label: 'All Agents' },
            { value: 'Monitor', label: 'Monitor' },
            { value: 'Executor', label: 'Executor' },
          ]} />
        </div>
        <div>
          <label className="label mb-1.5 block">Severity</label>
          <Dropdown value={severityFilter} onChange={setSeverityFilter} size="sm" options={[
            { value: 'all', label: 'All Severities' },
            { value: 'info', label: 'Info' },
            { value: 'warning', label: 'Warning' },
            { value: 'error', label: 'Error' },
          ]} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="label mb-1.5 block">Search</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="4.5" />
              <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
            </svg>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter logs..." className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] font-mono text-[12px] pl-9 pr-3 py-2 focus:outline-none focus:border-[var(--color-text-primary)] transition-colors placeholder:text-[var(--color-text-tertiary)]" />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="label">System Event Timeline</div>
          <div className="text-[11px] font-mono text-[var(--color-text-tertiary)]">{filteredLogs.length} events</div>
        </div>

        {filteredLogs.length === 0 ? (
          <EmptyState context="logs" />
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-[var(--color-border)]" />
            <div className="space-y-0.5">
              <AnimatePresence>
                {filteredLogs.map((log, i) => {
                  const severity = severityConfig[log.severity] || severityConfig.info
                  const agent = agentConfig[log.agent] || agentConfig.Monitor

                  return (
                    <motion.div key={log.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, delay: i * 0.015 }} className="relative pl-8 py-2.5">
                      <div className={`absolute left-[3px] top-[14px] w-[9px] h-[9px] rounded-full border-2 border-white ${severity.dot} z-10`} />
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3">
                        <div className="flex-shrink-0 sm:w-[120px]">
                          <div className="font-mono text-[var(--color-text-secondary)] text-[12px]">{formatTime(log.timestamp)}</div>
                          <div className="font-mono text-[var(--color-text-tertiary)] text-[11px]">{timeAgo(log.timestamp)}</div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${agent.color} ${agent.bg}`}>
                            {log.agent}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[var(--color-text-primary)] font-mono text-[12px] font-medium">{log.event_type}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${severity.color} ${severity.bg}`}>
                              {log.severity}
                            </span>
                          </div>
                          <div className="text-[var(--color-text-secondary)] text-[12px] leading-relaxed">{log.message}</div>
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
