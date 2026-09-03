import { useDashboard } from '../../context/DashboardContext'

export default function TopNav() {
  const { wsConnected } = useDashboard()

  return (
    <header
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      className="h-14 border-b flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-150"
    >
      <div className="flex items-center gap-4">
        {/* Live Status Indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              wsConnected ? 'bg-[var(--positive)] pulse-dot' : 'bg-[var(--negative)]'
            }`}
          />
          <span className="text-[11px] font-mono text-[var(--text)] font-medium">
            {wsConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        <span className="text-[var(--border)]">/</span>

        {/* Paper Trading Outline Badge */}
        <div
          style={{
            borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--warning) 8%, transparent)',
            color: 'var(--warning)',
          }}
          className="border px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-medium tracking-wide flex items-center gap-1.5"
        >
          <span>PAPER TRADING</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-faint)]">
        <span className="hidden sm:inline">PROTECTIVE-PUT AUTOMATION</span>
        <span className="hidden md:inline">MONITOR: 10S</span>
      </div>
    </header>
  )
}
