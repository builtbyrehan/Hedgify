import { Link } from 'react-router-dom'

export default function ClosingCta() {
  return (
    <section className="py-20 px-6" style={{ backgroundColor: '#0A0B0D' }}>
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="rounded-3xl p-12 border backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(17,18,20,0.6)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <h2
            className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.1] mb-4"
            style={{ fontFamily: 'var(--font-sans)', color: '#ECEEF1' }}
          >
            ready to protect your portfolio?
          </h2>

          <p className="text-[15px] mb-8 max-w-lg mx-auto" style={{ color: '#8A8C93' }}>
            start with paper trading. zero risk. full pipeline. see it react live.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-semibold text-white bg-[var(--brand)] rounded-full hover:opacity-90 transition-opacity"
              style={{ boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
            >
              launch dashboard
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
            </Link>
            <a
              href="https://github.com/builtbyrehan/hedgify"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-medium rounded-full border transition-colors"
              style={{ color: '#ECEEF1', borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              view on github
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
