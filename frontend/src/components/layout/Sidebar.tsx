import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/dashboard', icon: '📊', label: 'portfolio', end: true },
  { to: '/dashboard/alerts', icon: '🔔', label: 'alerts' },
  { to: '/dashboard/hedges', icon: '🛡', label: 'hedges' },
  { to: '/dashboard/stress-test', icon: '🧪', label: 'stress test' },
  { to: '/dashboard/logs', icon: '📄', label: 'logs' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-white/[0.06] bg-[var(--color-bg-surface)]/50 backdrop-blur-xl h-screen sticky top-0 flex flex-col">
      <div className="p-5 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center font-[var(--font-display)] font-bold text-sm text-[var(--color-bg-void)]">h</div>
        <div>
          <div className="font-[var(--font-display)] font-bold text-sm text-[var(--color-text-primary)]">hedgify</div>
          <div className="text-[10px] tracking-[0.14em] lowercase text-[var(--color-text-dim)]">portfolio insurance</div>
        </div>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] border border-[var(--color-accent-cyan)]/15'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.04] border border-transparent'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/[0.06]">
        <div className="text-[10px] text-[var(--color-text-dim)] font-mono tracking-wider lowercase">alpaca paper trading</div>
      </div>
    </aside>
  )
}
