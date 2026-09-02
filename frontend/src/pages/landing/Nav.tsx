import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">
      <nav
        className="max-w-6xl mx-auto flex items-center justify-between px-6 h-12 rounded-full border backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(10,11,13,0.6)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
        }}
      >
        <Link to="/" className="flex items-center">
          <img
            src="/logo/hedgify.png"
            alt="Hedgify"
            className="h-6 w-auto max-h-6 object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-6 text-[13px]" style={{ color: '#8A8C93' }}>
          <a href="#features" className="hover:text-[#ECEEF1] transition-colors">features</a>
          <a href="#how-it-works" className="hover:text-[#ECEEF1] transition-colors">how it works</a>
          <a href="#faq" className="hover:text-[#ECEEF1] transition-colors">faq</a>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/builtbyrehan/hedgify"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ color: '#8A8C93', backgroundColor: 'rgba(255,255,255,0.05)' }}
            title="GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold text-white bg-[var(--brand)] rounded-full hover:opacity-90 transition-opacity"
          >
            launch dashboard
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
          </Link>
        </div>
      </nav>
    </div>
  )
}
