const steps = [
  {
    number: '01',
    title: 'connect',
    description: 'link your alpaca paper trading account. no api keys touch our servers — everything runs locally.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'configure',
    description: 'set your drawdown threshold (default 2%), put strike offset (5% OTM), and expiry window (14 days).',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'protect',
    description: 'hedgify monitors continuously and auto-buys protective puts when your portfolio drops. watch it live.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
]

export default function HowItWorksStrip() {
  return (
    <section className="py-24 px-6" style={{ backgroundColor: '#0A0B0D' }}>
      <div className="max-w-5xl mx-auto text-center">
        <h2
          className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.1] mb-4"
          style={{ fontFamily: 'var(--font-sans)', color: '#ECEEF1' }}
        >
          how it works
        </h2>
        <p className="text-[15px] mb-14 max-w-md mx-auto" style={{ color: '#8A8C93' }}>
          three steps from setup to full protection. fully automated.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-8 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                />
              )}

              <div
                className="relative rounded-2xl p-8 border backdrop-blur-md transition-all duration-300 hover:border-[rgba(34,197,94,0.2)] group"
                style={{
                  backgroundColor: 'rgba(17,18,20,0.5)',
                  borderColor: 'rgba(255,255,255,0.05)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors duration-300 group-hover:bg-[rgba(34,197,94,0.1)]"
                  style={{
                    backgroundColor: 'rgba(34,197,94,0.06)',
                    color: '#22c55e',
                  }}
                >
                  {step.icon}
                </div>

                {/* Number */}
                <div
                  className="text-[11px] font-mono font-bold mb-2"
                  style={{ color: '#22c55e' }}
                >
                  {step.number}
                </div>

                {/* Title */}
                <h3
                  className="text-[18px] font-bold tracking-[-0.01em] mb-3"
                  style={{ fontFamily: 'var(--font-sans)', color: '#ECEEF1' }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-[13px] leading-relaxed" style={{ color: '#8A8C93' }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
