import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function Hero() {
  return (
    <section className="relative pt-28 pb-12 px-6 overflow-hidden" style={{ backgroundColor: '#0A0B0D' }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--brand)]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <div>
            <FadeIn delay={0.1}>
              <h1
                className="text-[clamp(2.5rem,5.5vw,4.2rem)] font-bold tracking-[-0.03em] leading-[1.05] mb-5"
                style={{ fontFamily: 'var(--font-sans)', color: '#ECEEF1' }}
              >
                ai-powered{' '}
                <span className="gradient-text-brand">portfolio insurance</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-[17px] leading-relaxed max-w-lg mb-8 lowercase" style={{ color: '#8A8C93' }}>
                keep your stocks. sleep at night.{' '}
                <span className="font-medium" style={{ color: '#ECEEF1' }}>
                  hedgify auto-buys protective puts when your portfolio drops — without selling a single share.
                </span>
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold text-white bg-[var(--brand)] rounded-[4px] hover:opacity-90 transition-opacity"
                >
                  launch dashboard
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium border rounded-[4px] transition-colors"
                  style={{ color: '#ECEEF1', borderColor: '#232428' }}
                >
                  see how it works
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <p className="text-[12px] font-mono" style={{ color: '#54565C' }}>
                paper trading only · no real funds at risk · connects in minutes
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={0.3} className="hidden lg:block">
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-[var(--brand)]/5 rounded-2xl blur-[60px]" />
              <img
                src="/hero/ChatGPT Image Sep 2, 2026, 10_59_40 PM.png"
                alt="Hedgify dashboard preview"
                className="relative w-[60%] h-auto rounded-2xl"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
