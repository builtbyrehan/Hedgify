import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function CountUp({ end, prefix = '', suffix = '' }: { end: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!isInView) return
    const start = performance.now()
    const dur = 1200
    let raf: number
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(end * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isInView, end])
  return <span ref={ref} className="font-mono tabular-nums">{prefix}{val.toLocaleString()}{suffix}</span>
}

const marqueeItems = [
  'ai-powered insurance', '✦', 'keep your shares', '✦', '24/7 monitoring', '✦',
  'auto-buy protective puts', '✦', 'sub-second execution', '✦', 'no selling required', '✦',
  'drawdown detection', '✦', 'idempotent hedging', '✦', 'paper trading live', '✦',
]

const features = [
  {
    num: '01',
    tag: 'monitor agent',
    title: 'watches your portfolio 24/7',
    desc: 'our ai agent polls your alpaca account every 10 seconds, tracking peak value and calculating drawdown in real-time. no sleep, no breaks, no missed events.',
    bullets: ['real-time portfolio tracking', 'peak value monitoring', 'automatic drawdown calculation'],
    stat: { value: 2400, label: 'polls per day', suffix: '' },
    emoji: '👁',
  },
  {
    num: '02',
    tag: 'drawdown detection',
    title: 'catches drops before they hurt',
    desc: 'when your portfolio drops 2% or more from its peak, the system fires an alert instantly. not after market close. not tomorrow. now.',
    bullets: ['configurable threshold (default 2%)', 'instant alert via websocket', 'idempotency guard prevents spam'],
    stat: { value: 200, label: 'millisecond detection', suffix: 'ms' },
    emoji: '🔔',
  },
  {
    num: '03',
    tag: 'hedge executor',
    title: 'buys protection automatically',
    desc: 'the moment a drawdown is confirmed, our executor places a 5% out-of-the-money put option with a 14-day expiry. you keep your shares. the downside is capped.',
    bullets: ['5% OTM protective puts', '14-day expiry cycle', 'automatic order placement'],
    stat: { value: 95, label: 'downside protected', suffix: '%' },
    emoji: '🛡',
  },
  {
    num: '04',
    tag: 'idempotency',
    title: 'never double-buys. ever.',
    desc: 'our supervisor-worker architecture has a built-in idempotency guard. even if 10 alerts fire in a row, only one hedge gets placed. no duplicate orders. no wasted premium.',
    bullets: ['supervisor → worker handoff', 'one hedge per alert window', 'burst-alert protection'],
    stat: { value: 0, label: 'duplicate hedges', suffix: '' },
    emoji: '✓',
  },
  {
    num: '05',
    tag: 'stress test',
    title: 'watch it react live',
    desc: 'hit the "trigger crash" button and watch the entire pipeline fire in real-time. portfolio drops → alert appears → hedge is placed. all visible in under 2 seconds.',
    bullets: ['simulated drawdown injection', 'live websocket updates', 'side-by-side comparison'],
    stat: { value: 2, label: 'seconds to full cycle', suffix: 's' },
    emoji: '🧪',
  },
  {
    num: '06',
    tag: 'portfolio insurance',
    title: 'stop-losses are dead. hedgify is alive.',
    desc: 'stop-losses force you to sell. hedgify buys insurance instead. you keep your shares, keep your upside, and sleep at night knowing your downside is capped.',
    bullets: ['keep every share you own', 'cap your downside', 'sleep at night'],
    stat: { value: 100, label: 'shares retained', suffix: '%' },
    emoji: '🌙',
  },
]

const techStack = [
  { name: 'alpaca', desc: 'paper trading api' },
  { name: 'fastapi', desc: 'backend server' },
  { name: 'react', desc: 'dashboard ui' },
  { name: 'sqlite', desc: 'persistent storage' },
  { name: 'mcp', desc: 'agent protocol' },
]

const faqs = [
  { q: 'is this real trading?', a: 'hedgify connects to alpaca paper trading — no real money at risk. it demonstrates the full pipeline: monitor → detect → hedge. switching to live trading would require additional broker integration and regulatory compliance.' },
  { q: 'why 2% drawdown threshold?', a: '2% is a configurable sweet spot: sensitive enough to catch meaningful drops, but not so tight it triggers on normal market noise. you can adjust it in config.py.' },
  { q: 'what happens if the websocket disconnects?', a: 'the dashboard shows a clear "reconnecting" state and auto-retries every 5 seconds. the backend keeps running independently — alerts and hedges fire even if the dashboard is offline.' },
  { q: 'how does idempotency work?', a: 'each alert has a cooldown window. if multiple alerts fire within that window, only the first triggers a hedge. the supervisor-worker architecture ensures exactly-once execution.' },
  { q: 'can i customize the put options?', a: 'yes — strike percentage (default 5% OTM) and expiry (default 14 days) are configurable. the executor uses these parameters for every hedge placement.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)] font-[var(--font-body)] overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[var(--color-bg-void)]/70 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center font-[var(--font-display)] font-bold text-xs text-[var(--color-bg-void)]">h</div>
            <span className="font-[var(--font-display)] font-bold text-sm text-[var(--color-text-primary)]">hedgify</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
            <a href="#features" className="hover:text-[var(--color-text-primary)] transition-colors">features</a>
            <a href="#how-it-works" className="hover:text-[var(--color-text-primary)] transition-colors">how it works</a>
            <a href="#pricing" className="hover:text-[var(--color-text-primary)] transition-colors">pricing</a>
            <a href="#faq" className="hover:text-[var(--color-text-primary)] transition-colors">faq</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="btn-pill btn-pill-ghost text-xs px-4 py-2">log in</Link>
            <Link to="/dashboard" className="btn-pill btn-pill-gold text-xs px-4 py-2">start free →</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-8 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[var(--color-accent-cyan)]/5 rounded-full blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-[var(--color-accent-violet)]/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] text-xs font-mono font-bold tracking-wider mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)] pulse-glow" />
              built for alpaca ai trading agents hackathon @ lablab.ai
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-[var(--font-display)] text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-[0.95]">
              <span className="bg-gradient-to-r from-[var(--color-accent-cyan)] via-white to-[var(--color-accent-gold)] bg-clip-text text-transparent">
                ai-powered portfolio insurance
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg sm:text-xl text-[var(--color-text-muted)] max-w-xl mx-auto mb-8 leading-relaxed lowercase">
              keep your stocks. sleep at night. <span className="text-[var(--color-text-primary)] font-medium">hedgify auto-buys protective puts when your portfolio drops.</span>
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex items-center justify-center gap-4 mb-10">
              <Link to="/dashboard" className="btn-pill btn-pill-gold text-base px-8 py-3.5">
                launch dashboard
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
              </Link>
              <a href="#features" className="btn-pill btn-pill-ghost text-base px-8 py-3.5">see how it works</a>
            </div>
          </FadeIn>

          {/* Hero mockup — chat bubbles */}
          <FadeIn delay={0.4}>
            <div className="relative max-w-md mx-auto">
              <div className="space-y-3">
                <div className="chat-bubble chat-bubble-ai flex items-start gap-2">
                  <span className="text-sm mt-0.5">🤖</span>
                  <div>
                    <div className="text-xs text-[var(--color-accent-cyan)] font-mono font-bold mb-1">ai agent · now</div>
                    portfolio value: $124,382 · drawdown: 2.14% from peak
                  </div>
                </div>
                <div className="chat-bubble chat-bubble-ai flex items-start gap-2 ml-6">
                  <span className="text-sm mt-0.5">🔔</span>
                  <div>
                    <div className="text-xs text-[var(--color-accent-danger)] font-mono font-bold mb-1">alert fired · 2s ago</div>
                    threshold breached → hedge executor activated
                  </div>
                </div>
                <div className="chat-bubble chat-bubble-ai flex items-start gap-2 ml-12">
                  <span className="text-sm mt-0.5">🛡</span>
                  <div>
                    <div className="text-xs text-[var(--color-accent-gold)] font-mono font-bold mb-1">hedge placed · 1s ago</div>
                    aapl 5% otm put · 14d expiry · $50 premium
                  </div>
                </div>
              </div>
              {/* Floating toast */}
              <div className="absolute -top-3 -right-4 toast-chip toast-enter">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] pulse-glow" />
                ai replied in 200ms ⚡
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="py-8 overflow-hidden border-y border-white/[0.04]">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className={`mx-4 text-sm whitespace-nowrap ${item === '✦' ? 'text-[var(--color-accent-cyan)]' : 'text-[var(--color-text-dim)] font-mono lowercase'}`}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES: 01–06 ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-24">
          {features.map((f, idx) => (
            <FadeIn key={f.num} delay={0.05}>
              <div className={`feature-grid ${idx % 2 === 1 ? 'feature-grid-reversed' : ''}`}>
                {/* Copy side */}
                <div>
                  <div className="section-num">{f.num}</div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono font-bold tracking-wider text-[var(--color-text-muted)] uppercase mb-4">
                    <span>{f.emoji}</span> {f.tag}
                  </div>
                  <h3 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold mb-3 leading-tight lowercase">{f.title}</h3>
                  <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-5 max-w-md">{f.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {f.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-center gap-2.5 text-sm text-[var(--color-text-muted)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)] shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="stat-callout">
                    <div className="stat-number text-3xl text-[var(--color-text-primary)]">
                      <CountUp end={f.stat.value} suffix={f.stat.suffix} />
                    </div>
                    <div className="stat-label">{f.stat.label}</div>
                  </div>
                </div>
                {/* Mockup side */}
                <div className="glass rounded-3xl p-6 relative overflow-hidden min-h-[280px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-cyan)]/5 to-transparent" />
                  <div className="relative text-center">
                    <div className="text-6xl mb-4">{f.emoji}</div>
                    <div className="font-[var(--font-display)] text-4xl font-black text-[var(--color-text-primary)]/10">{f.num}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PROBLEM STATEMENT ── */}
      <section className="py-20 px-6 bg-[var(--color-bg-surface)]/50">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="section-num">07</div>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold mb-12 lowercase">why stop-losses are broken</h2>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            <FadeIn delay={0.1}>
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-8">
                <div className="text-xs font-mono font-bold text-[var(--color-accent-danger)] mb-3 tracking-wider lowercase">the old way ✕</div>
                <h3 className="font-[var(--font-display)] text-xl font-bold mb-4 lowercase">stop-loss orders</h3>
                <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
                  <li className="flex items-start gap-3"><span className="text-[var(--color-accent-danger)]">✕</span> panic-sell during temporary dips</li>
                  <li className="flex items-start gap-3"><span className="text-[var(--color-accent-danger)]">✕</span> miss rebounds after sharp recoveries</li>
                  <li className="flex items-start gap-3"><span className="text-[var(--color-accent-danger)]">✕</span> permanent loss — shares are gone forever</li>
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="rounded-3xl border border-[var(--color-accent-cyan)]/20 bg-[var(--color-accent-cyan)]/[0.04] p-8">
                <div className="text-xs font-mono font-bold text-[var(--color-accent-cyan)] mb-3 tracking-wider lowercase">the new way ✓</div>
                <h3 className="font-[var(--font-display)] text-xl font-bold mb-4 lowercase">hedgify insurance</h3>
                <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
                  <li className="flex items-start gap-3"><span className="text-[var(--color-accent-cyan)]">✓</span> buy protective puts automatically</li>
                  <li className="flex items-start gap-3"><span className="text-[var(--color-accent-cyan)]">✓</span> keep every share you own</li>
                  <li className="flex items-start gap-3"><span className="text-[var(--color-accent-cyan)]">✓</span> ai monitors 24/7 and acts in milliseconds</li>
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-center mb-4 lowercase">how it works</h2>
            <p className="text-[var(--color-text-muted)] text-center mb-14 max-w-lg mx-auto lowercase">three steps from detection to protection. fully automated.</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '👁', title: 'monitor', desc: 'watches your portfolio 24/7 using ai-powered analysis.', color: 'var(--color-accent-cyan)' },
              { step: '02', icon: '🔔', title: 'detect', desc: 'identifies drawdowns of 2% or more instantly.', color: 'var(--color-accent-gold)' },
              { step: '03', icon: '🛡', title: 'protect', desc: 'auto-buys protective puts to cap your downside.', color: 'var(--color-accent-violet)' },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.12}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-3xl mb-5 mx-auto">{s.icon}</div>
                  <div className="section-num justify-center">{s.step}</div>
                  <h3 className="font-[var(--font-display)] text-xl font-bold mb-2 lowercase">{s.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className="py-20 px-6 bg-[var(--color-bg-surface)]/50">
        <div className="max-w-5xl mx-auto text-center">
          <FadeIn>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold mb-12 lowercase">built with</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap justify-center gap-5">
              {techStack.map(t => (
                <div key={t.name} className="px-7 py-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] transition-colors">
                  <div className="font-mono font-bold text-base text-[var(--color-accent-cyan)] lowercase">{t.name}</div>
                  <div className="text-xs text-[var(--color-text-dim)] mt-1">{t.desc}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-center mb-4 lowercase">simple pricing</h2>
            <p className="text-[var(--color-text-muted)] text-center mb-12 max-w-md mx-auto lowercase">free to start. scale when you're ready.</p>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { tier: 'free', price: '$0', period: '/forever', desc: 'for tinkerers', features: ['1 portfolio', 'paper trading only', 'basic alerts', 'community support'], highlight: false },
              { tier: 'starter', price: '$19', period: '/mo', desc: 'for individual traders', features: ['3 portfolios', 'paper + live trading', 'auto-hedging', 'email alerts', '5 put configs'], highlight: false },
              { tier: 'growth', price: '$49', period: '/mo', desc: 'for active traders', features: ['10 portfolios', 'all trading modes', 'advanced analytics', 'priority support', 'unlimited puts', 'custom thresholds'], highlight: true },
            ].map(p => (
              <FadeIn key={p.tier} delay={p.highlight ? 0.15 : 0.1}>
                <div className={`rounded-3xl p-7 ${p.highlight ? 'border-2 border-[var(--color-accent-gold)]/40 bg-[var(--color-accent-gold)]/[0.04] relative' : 'border border-white/[0.06] bg-white/[0.03]'}`}>
                  {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--color-accent-gold)] text-[var(--color-bg-void)] text-[10px] font-mono font-bold tracking-wider uppercase">most popular</div>}
                  <div className="text-xs font-mono font-bold text-[var(--color-text-muted)] tracking-wider lowercase mb-2">{p.tier}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-[var(--font-display)] text-3xl font-black">{p.price}</span>
                    <span className="text-sm text-[var(--color-text-dim)]">{p.period}</span>
                  </div>
                  <div className="text-xs text-[var(--color-text-dim)] mb-5">{p.desc}</div>
                  <ul className="space-y-2.5 mb-6">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <span className="text-[var(--color-accent-cyan)] text-xs">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/dashboard" className={`btn-pill w-full justify-center text-sm ${p.highlight ? 'btn-pill-gold' : 'btn-pill-ghost'}`}>get started</Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6 bg-[var(--color-bg-surface)]/50">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-center mb-12 lowercase">faq</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="space-y-0 divide-y divide-white/[0.06]">
              {faqs.map((f, i) => (
                <details key={i} className="faq-item">
                  <summary>{f.q}</summary>
                  <div className="faq-body">{f.a}</div>
                </details>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-6">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-cyan)]/5 via-transparent to-[var(--color-accent-gold)]/5" />
            <div className="relative">
              <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold mb-4 lowercase">ready to protect your portfolio?</h2>
              <p className="text-[var(--color-text-muted)] mb-8 max-w-md mx-auto lowercase">start with paper trading. zero risk. full pipeline. see it react live.</p>
              <Link to="/dashboard" className="btn-pill btn-pill-gold text-base px-10 py-4">
                launch dashboard →
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center font-bold text-[8px] text-[var(--color-bg-void)]">h</div>
            <span className="text-xs text-[var(--color-text-dim)]">hedgify · stop-loss for people who don't want to sell.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-dim)]">
            <a href="https://lablab.ai/event/alpaca-ai-trading-agents-hackathon" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent-cyan)] transition-colors">hackathon</a>
            <span>·</span>
            <span>built by team axiom · {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
